import { subjects, searchSubjects, getSubjectsByYear } from '../data/subjects.js';
import { supabase, ADMIN_EMAIL, isSupabaseConfigured } from '../supabase.js';
import { getCurrentUser, isAdmin, getUsername, signIn, showToast } from '../components/auth.js';

let selectedSubject = null;
let realtimeSubscription = null;

export function renderSearch(container) {
  container.innerHTML = `
    <div class="search-page">
      <div class="search-header fade-in">
        <h1 class="glow-text">Find Your PYQs 🔍</h1>
        <p>Search from 50+ subjects — Midsem & Endsem merged into one paper</p>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" id="search-input"
                 placeholder="Type your subject name... (e.g., DBMS, Operating System)"
                 autocomplete="off" />
        </div>
        <div class="autocomplete-dropdown" id="autocomplete-dropdown"></div>
      </div>

      <!-- PDF Result Area -->
      <div id="pdf-result-area"></div>

      <!-- Year Tabs & Subject Grid -->
      <div class="year-tabs" id="year-tabs">
        <button class="year-tab active" data-year="all">All</button>
        <button class="year-tab" data-year="1">1st Year</button>
        <button class="year-tab" data-year="2">2nd Year</button>
        <button class="year-tab" data-year="3">3rd Year</button>
        <button class="year-tab" data-year="4">4th Year</button>
      </div>

      <div class="subject-grid" id="subject-grid"></div>

      <!-- Upload Section -->
      <div class="divider container" style="margin-top: 60px;"></div>
      <div class="upload-section" id="upload-section">
        <h2 class="glow-text" style="text-align:center; margin-bottom: 24px;">📤 Upload PYQ Papers</h2>
        <div id="upload-content"></div>
      </div>

      <footer class="copyright-footer no-select">
        <p>© 2026 KIIT KHOJ. All rights reserved.</p>
      </footer>
    </div>
  `;

  initSearchAutocomplete(container);
  initYearTabs(container);
  renderSubjectGrid(container, 'all');
  renderUploadSection(container);
}

// ===== SEARCH AUTOCOMPLETE =====
function initSearchAutocomplete(container) {
  const input = container.querySelector('#search-input');
  const dropdown = container.querySelector('#autocomplete-dropdown');
  let activeIndex = -1;

  input.addEventListener('input', () => {
    const query = input.value.trim();
    if (query.length < 1) {
      dropdown.classList.remove('active');
      return;
    }

    const results = searchSubjects(query);
    if (results.length === 0) {
      dropdown.classList.remove('active');
      return;
    }

    activeIndex = -1;
    dropdown.innerHTML = results.map((s, i) => {
      const highlighted = highlightMatch(s.name, query);
      return `
        <div class="autocomplete-item" data-index="${i}" data-name="${s.name}">
          <span class="subject-name">${highlighted}</span>
          <span class="subject-abbr">${s.abbr}</span>
        </div>
      `;
    }).join('');
    dropdown.classList.add('active');

    dropdown.querySelectorAll('.autocomplete-item').forEach((item) => {
      item.addEventListener('click', () => {
        selectSubject(item.dataset.name, container);
        dropdown.classList.remove('active');
        input.value = item.dataset.name;
      });
    });
  });

  // Keyboard nav
  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      updateActiveItem(items, activeIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActiveItem(items, activeIndex);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].click();
    } else if (e.key === 'Escape') {
      dropdown.classList.remove('active');
    }
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      dropdown.classList.remove('active');
    }
  });
}

function updateActiveItem(items, index) {
  items.forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });
  if (items[index]) {
    items[index].scrollIntoView({ block: 'nearest' });
  }
}

function highlightMatch(text, query) {
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// ===== YEAR TABS & SUBJECT GRID =====
function initYearTabs(container) {
  container.querySelectorAll('.year-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.year-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      renderSubjectGrid(container, tab.dataset.year);
    });
  });
}

function renderSubjectGrid(container, year) {
  const grid = container.querySelector('#subject-grid');
  const filtered = year === 'all' ? subjects : getSubjectsByYear(parseInt(year));

  grid.innerHTML = filtered.map((s) => `
    <div class="glass-card subject-card" data-name="${s.name}">
      <h3>${s.name}</h3>
      <div class="subject-meta">
        <span class="badge badge-primary">${s.abbr}</span>
        <span class="badge badge-cyan">Year ${s.year}</span>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.subject-card').forEach((card) => {
    card.addEventListener('click', () => {
      selectSubject(card.dataset.name, container);
      container.querySelector('#search-input').value = card.dataset.name;
      container.querySelector('#pdf-result-area').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// ===== SELECT SUBJECT — LOAD PDFS + DISCUSSION =====
async function selectSubject(subjectName, container) {
  selectedSubject = subjectName;
  const area = container.querySelector('#pdf-result-area');

  area.innerHTML = `
    <div class="pdf-result">
      <div class="pdf-result-header">
        <h2>📄 ${subjectName}</h2>
        <div class="pdf-result-actions">
          <span class="badge badge-emerald">PYQ Papers</span>
        </div>
      </div>
      <div id="pdf-list-container">
        <div class="spinner"></div>
      </div>
      <div class="divider"></div>
      <div id="discussion-container">
        <div class="spinner"></div>
      </div>
    </div>
  `;

  await loadPDFs(subjectName, area);
  await loadDiscussions(subjectName, area);
}

// ===== PDF LIST =====
async function loadPDFs(subject, area) {
  const listContainer = area.querySelector('#pdf-list-container');

  if (!isSupabaseConfigured()) {
    listContainer.innerHTML = `
      <div class="pdf-no-result">
        <span class="icon">⚙️</span>
        <p>Configure Supabase to see uploaded PDFs</p>
        <p style="font-size: 0.8rem; color: var(--text-muted);">Add your Supabase URL and key to .env file</p>
      </div>
    `;
    return;
  }

  try {
    const { data, error } = await supabase
      .from('pdfs')
      .select('*')
      .eq('subject', subject)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      listContainer.innerHTML = `
        <div class="pdf-no-result">
          <span class="icon">📭</span>
          <p>No PYQs uploaded yet for <strong>${subject}</strong></p>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Be the first to upload! Use the upload section below.</p>
        </div>
      `;
      return;
    }

    const user = getCurrentUser();
    listContainer.innerHTML = `
      <div class="pdf-list">
        ${data.map((pdf) => `
          <div class="pdf-list-item" data-url="${pdf.file_url}" data-id="${pdf.id}">
            <div class="pdf-info">
              <span class="pdf-icon">📄</span>
              <div>
                <div class="pdf-name">${pdf.file_name}</div>
                <div class="pdf-date">${new Date(pdf.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>
            <div class="pdf-actions">
              <button class="btn btn-secondary btn-small preview-btn" data-url="${pdf.file_url}">👁 Preview</button>
              <a href="${pdf.file_url}" target="_blank" download class="btn btn-primary btn-small">⬇ Download</a>
              ${(user && (user.email === pdf.uploader_email || isAdmin())) ?
                `<button class="btn btn-danger btn-small delete-pdf-btn" data-id="${pdf.id}" data-path="${pdf.file_name}">🗑</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <div id="pdf-preview-frame"></div>
    `;

    // Preview buttons
    listContainer.querySelectorAll('.preview-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const frameContainer = listContainer.querySelector('#pdf-preview-frame');
        frameContainer.innerHTML = `
          <div class="pdf-frame-container">
            <iframe src="${btn.dataset.url}" title="PDF Preview"></iframe>
          </div>
        `;
      });
    });

    // Delete buttons
    listContainer.querySelectorAll('.delete-pdf-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Delete this PDF?')) return;

        try {
          // Delete from storage
          const filePath = `pdfs/${btn.dataset.path}`;
          await supabase.storage.from('pdfs').remove([filePath]);

          // Delete from database
          const { error } = await supabase.from('pdfs').delete().eq('id', btn.dataset.id);
          if (error) throw error;

          showToast('PDF deleted successfully', 'success');
          loadPDFs(subject, area);
        } catch (err) {
          showToast('Failed to delete: ' + err.message, 'error');
        }
      });
    });
  } catch (err) {
    listContainer.innerHTML = `
      <div class="pdf-no-result">
        <span class="icon">⚠️</span>
        <p>Error loading PDFs: ${err.message}</p>
      </div>
    `;
  }
}

// ===== DISCUSSION FORUM =====
async function loadDiscussions(subject, area) {
  const container = area.querySelector('#discussion-container');
  const user = getCurrentUser();

  container.innerHTML = `
    <div class="discussion-section" style="padding: 0;">
      <div class="discussion-header">
        <h2>💬 Discussion Forum — ${subject}</h2>
        <div class="discussion-search">
          <input type="text" class="input-field" id="discussion-search-input" placeholder="Search Q&A..." />
          <button class="btn btn-secondary btn-small" id="discussion-search-btn">🔍 Find</button>
        </div>
      </div>

      ${user ? `
        <div class="discussion-form">
          <div class="form-header">
            <h3>Ask a question or share knowledge</h3>
            <label class="anonymous-toggle">
              <input type="checkbox" id="anon-toggle" />
              <span class="toggle-slider"></span>
              <span>Anonymous</span>
            </label>
          </div>
          <textarea class="input-field" id="discussion-input" placeholder="Type your question or answer..."></textarea>
          <div class="form-actions">
            <button class="btn btn-primary" id="post-btn">📝 Post</button>
          </div>
        </div>
      ` : `
        <div class="login-prompt">
          <p>Login with your KIIT email to join the discussion</p>
          <button class="btn btn-primary" id="discussion-login-btn">🔐 Login to Participate</button>
        </div>
      `}

      <div class="discussion-posts" id="discussion-posts">
        <div class="spinner"></div>
      </div>
    </div>
  `;

  if (!user) {
    const loginBtn = container.querySelector('#discussion-login-btn');
    if (loginBtn) loginBtn.addEventListener('click', signIn);
  }

  // Post button
  const postBtn = container.querySelector('#post-btn');
  if (postBtn) {
    postBtn.addEventListener('click', async () => {
      const input = container.querySelector('#discussion-input');
      const content = input.value.trim();
      if (!content) return;

      const isAnon = container.querySelector('#anon-toggle').checked;
      const username = isAnon ? 'Anonymous' : getUsername();

      try {
        const { error } = await supabase.from('discussions').insert({
          subject: subject,
          content: content,
          user_id: user.id,
          username: username,
          is_anonymous: isAnon,
        });

        if (error) throw error;
        input.value = '';
        showToast('Posted successfully!', 'success');
        fetchDiscussionPosts(subject, container);
      } catch (err) {
        showToast('Failed to post: ' + err.message, 'error');
      }
    });
  }

  // Search
  const searchBtn = container.querySelector('#discussion-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const query = container.querySelector('#discussion-search-input').value.trim();
      fetchDiscussionPosts(subject, container, query);
    });
  }

  // Initial load
  fetchDiscussionPosts(subject, container);

  // Real-time subscription
  if (realtimeSubscription) {
    realtimeSubscription.unsubscribe();
  }

  if (isSupabaseConfigured()) {
    realtimeSubscription = supabase
      .channel('discussions-' + subject)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discussions', filter: `subject=eq.${subject}` }, () => {
        fetchDiscussionPosts(subject, container);
      })
      .subscribe();
  }
}

async function fetchDiscussionPosts(subject, container, searchQuery = '') {
  const postsDiv = container.querySelector('#discussion-posts');

  if (!isSupabaseConfigured()) {
    postsDiv.innerHTML = `
      <div class="no-posts">
        <span class="icon">⚙️</span>
        <p>Configure Supabase to see discussions</p>
      </div>
    `;
    return;
  }

  try {
    let query = supabase
      .from('discussions')
      .select('*')
      .eq('subject', subject)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.ilike('content', `%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      postsDiv.innerHTML = `
        <div class="no-posts">
          <span class="icon">💬</span>
          <p>${searchQuery ? 'No matching discussions found' : 'No discussions yet. Be the first to post!'}</p>
        </div>
      `;
      return;
    }

    postsDiv.innerHTML = '';
    for (const post of data) {
      postsDiv.appendChild(createPostElement(post, subject, container));
    }
  } catch (err) {
    postsDiv.innerHTML = `<div class="no-posts"><p>Error: ${err.message}</p></div>`;
  }
}

function createPostElement(post, subject, parentContainer) {
  const div = document.createElement('div');
  div.className = 'discussion-post';

  const initial = post.is_anonymous ? '?' : (post.username?.[0]?.toUpperCase() || '?');
  const timeStr = new Date(post.created_at).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  const user = getCurrentUser();
  const canDelete = user && (user.id === post.user_id || isAdmin());

  div.innerHTML = `
    <div class="post-header">
      <div class="post-author">
        <div class="post-avatar">${initial}</div>
        <div>
          <div class="post-name ${post.is_anonymous ? 'anonymous' : ''}">
            ${post.is_anonymous ? '🎭 Anonymous' : post.username}
          </div>
          <div class="post-time">${timeStr}</div>
        </div>
      </div>
      ${canDelete ? `<button class="btn btn-danger btn-small delete-post-btn" data-id="${post.id}">🗑</button>` : ''}
    </div>
    <div class="post-content">${escapeHtml(post.content)}</div>
    <div class="post-actions">
      <button class="post-action-btn reply-toggle-btn">💬 Reply</button>
    </div>
    <div class="replies-container" id="replies-${post.id}"></div>
  `;

  // Delete post
  const deleteBtn = div.querySelector('.delete-post-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Delete this post?')) return;
      try {
        await supabase.from('discussions').delete().eq('id', post.id);
        showToast('Post deleted', 'success');
        fetchDiscussionPosts(subject, parentContainer);
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });
  }

  // Reply toggle
  const replyBtn = div.querySelector('.reply-toggle-btn');
  replyBtn.addEventListener('click', () => {
    const repliesDiv = div.querySelector(`#replies-${post.id}`);
    if (repliesDiv.querySelector('.reply-form')) {
      repliesDiv.querySelector('.reply-form').remove();
      return;
    }
    if (!user) {
      showToast('Please login to reply', 'info');
      return;
    }
    const form = document.createElement('div');
    form.className = 'reply-form';
    form.innerHTML = `
      <input type="text" class="input-field" placeholder="Write a reply..." />
      <label class="anonymous-toggle" style="min-width:fit-content;">
        <input type="checkbox" class="reply-anon" />
        <span class="toggle-slider"></span>
      </label>
      <button class="btn btn-primary btn-small">Send</button>
    `;
    form.querySelector('.btn').addEventListener('click', async () => {
      const content = form.querySelector('.input-field').value.trim();
      if (!content) return;
      const isAnon = form.querySelector('.reply-anon').checked;
      try {
        await supabase.from('discussions').insert({
          subject: subject,
          content: content,
          user_id: user.id,
          username: isAnon ? 'Anonymous' : getUsername(),
          is_anonymous: isAnon,
          parent_id: post.id,
        });
        showToast('Reply posted!', 'success');
        loadReplies(post.id, repliesDiv, subject);
        form.remove();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });
    repliesDiv.appendChild(form);
  });

  // Load replies
  const repliesDiv = div.querySelector(`#replies-${post.id}`);
  loadReplies(post.id, repliesDiv, subject);

  return div;
}

async function loadReplies(parentId, container, subject) {
  if (!isSupabaseConfigured()) return;

  try {
    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return;

    // Remove existing replies (not the form)
    container.querySelectorAll('.reply').forEach((r) => r.remove());

    data.forEach((reply) => {
      const replyDiv = document.createElement('div');
      replyDiv.className = 'reply';
      const initial = reply.is_anonymous ? '?' : (reply.username?.[0]?.toUpperCase() || '?');
      const timeStr = new Date(reply.created_at).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
      replyDiv.innerHTML = `
        <div class="post-header" style="margin-bottom:6px;">
          <div class="post-author">
            <div class="post-avatar">${initial}</div>
            <div>
              <span class="post-name ${reply.is_anonymous ? 'anonymous' : ''}" style="font-size:0.85rem;">
                ${reply.is_anonymous ? '🎭 Anonymous' : reply.username}
              </span>
              <span class="post-time" style="margin-left:8px;">${timeStr}</span>
            </div>
          </div>
        </div>
        <div class="post-content" style="font-size:0.88rem;margin-bottom:0;">${escapeHtml(reply.content)}</div>
      `;
      container.insertBefore(replyDiv, container.querySelector('.reply-form'));
    });
  } catch (err) {
    console.error('Error loading replies:', err);
  }
}

// ===== UPLOAD SECTION =====
function renderUploadSection(container) {
  const uploadContent = container.querySelector('#upload-content');
  const user = getCurrentUser();

  if (!user) {
    uploadContent.innerHTML = `
      <div class="login-prompt">
        <p>Login with your KIIT email to upload PYQ papers</p>
        <button class="btn btn-primary" id="upload-login-btn">🔐 Login to Upload</button>
      </div>
    `;
    uploadContent.querySelector('#upload-login-btn').addEventListener('click', signIn);
    return;
  }

  uploadContent.innerHTML = `
    <div class="upload-zone" id="upload-zone">
      <span class="icon">📁</span>
      <p>Drag & drop your PDF here</p>
      <p class="hint">or click to browse • PDF only • Max 10MB</p>
      <input type="file" id="file-input" accept=".pdf" style="display:none;" />
    </div>
    <div class="upload-form-fields" id="upload-fields" style="display:none;">
      <select class="input-field" id="upload-subject">
        <option value="">Select Subject...</option>
        ${subjects.map((s) => `<option value="${s.name}">${s.name} (${s.abbr})</option>`).join('')}
      </select>
      <div id="selected-file-name" style="color: var(--text-secondary); font-size: 0.9rem;"></div>
      <button class="btn btn-primary" id="upload-btn">📤 Upload PDF</button>
    </div>
  `;

  const zone = uploadContent.querySelector('#upload-zone');
  const fileInput = uploadContent.querySelector('#file-input');
  const fields = uploadContent.querySelector('#upload-fields');
  let selectedFile = null;

  zone.addEventListener('click', () => fileInput.click());

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      handleFile(file);
    } else {
      showToast('Please upload a PDF file', 'error');
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large! Max 10MB', 'error');
      return;
    }
    selectedFile = file;
    fields.style.display = 'flex';
    uploadContent.querySelector('#selected-file-name').textContent = `📎 Selected: ${file.name}`;
  }

  uploadContent.querySelector('#upload-btn').addEventListener('click', async () => {
    if (!selectedFile) {
      showToast('Please select a file first', 'error');
      return;
    }
    const subject = uploadContent.querySelector('#upload-subject').value;
    if (!subject) {
      showToast('Please select a subject', 'error');
      return;
    }

    const uploadBtn = uploadContent.querySelector('#upload-btn');
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';

    try {
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `pdfs/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pdfs')
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase.from('pdfs').insert({
        subject: subject,
        file_url: urlData.publicUrl,
        file_name: fileName,
        uploaded_by: user.id,
        uploader_email: user.email,
      });

      if (dbError) throw dbError;

      showToast('PDF uploaded successfully! 🎉', 'success');
      selectedFile = null;
      fields.style.display = 'none';
      fileInput.value = '';

      // Refresh if same subject selected
      if (selectedSubject === subject) {
        selectSubject(subject, container);
      }
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = '📤 Upload PDF';
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
