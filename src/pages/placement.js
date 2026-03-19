import { supabase, ADMIN_EMAIL, isSupabaseConfigured } from '../supabase.js';
import { getCurrentUser, isAdmin, getUsername, signIn, showToast } from '../components/auth.js';

export function renderPlacement(container) {
  container.innerHTML = `
    <div class="placement-page">
      <div class="placement-header fade-in">
        <h1 class="glow-text">Placement Talks 💼</h1>
        <p>Share & read real interview experiences from KIIT peers. Learn from those who've been there.</p>
      </div>

      <!-- Company Search -->
      <div class="company-search">
        <input type="text" class="input-field" id="company-search-input" placeholder="🔍 Search by company name..." />
      </div>

      <!-- Company Tags -->
      <div class="companies-list" id="companies-list"></div>

      <!-- Share Form -->
      <div id="share-form-area"></div>

      <!-- Placement Cards -->
      <div class="placement-grid" id="placement-grid">
        <div class="spinner"></div>
      </div>

      <footer class="copyright-footer no-select" style="max-width: var(--container-max); margin: 60px auto 0;">
        <p>© 2026 KIIT KHOJ. All rights reserved.</p>
      </footer>
    </div>
  `;

  renderShareForm(container);
  loadPlacements(container);
  initCompanySearch(container);
}

function renderShareForm(container) {
  const area = container.querySelector('#share-form-area');
  const user = getCurrentUser();

  if (!user) {
    area.innerHTML = `
      <div class="share-form container">
        <div class="login-prompt" style="background: none; border: none; padding: 20px 0;">
          <p>Login to share your interview experience</p>
          <button class="btn btn-primary" id="placement-login-btn">🔐 Login with KIIT Mail</button>
        </div>
      </div>
    `;
    area.querySelector('#placement-login-btn').addEventListener('click', signIn);
    return;
  }

  area.innerHTML = `
    <div class="share-form container">
      <h2>✍️ Share Your Experience</h2>
      <div class="form-row">
        <input type="text" class="input-field" id="share-company" placeholder="Company Name (e.g., TCS, Infosys)" />
        <input type="text" class="input-field" id="share-role" placeholder="Role (e.g., SDE, Data Analyst)" />
      </div>
      <div class="form-full">
        <textarea class="input-field" id="share-questions" placeholder="Interview Questions Asked..."></textarea>
      </div>
      <div class="form-full">
        <textarea class="input-field" id="share-experience" placeholder="Your experience, tips, and thoughts..."></textarea>
      </div>
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
        <label class="anonymous-toggle">
          <input type="checkbox" id="placement-anon-toggle" />
          <span class="toggle-slider"></span>
          <span>Post Anonymously</span>
        </label>
        <button class="btn btn-primary" id="share-btn">📤 Share Experience</button>
      </div>
    </div>
  `;

  area.querySelector('#share-btn').addEventListener('click', async () => {
    const company = area.querySelector('#share-company').value.trim();
    const role = area.querySelector('#share-role').value.trim();
    const questions = area.querySelector('#share-questions').value.trim();
    const experience = area.querySelector('#share-experience').value.trim();
    const isAnon = area.querySelector('#placement-anon-toggle').checked;

    if (!company || !experience) {
      showToast('Please fill in Company and Experience fields', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('placements').insert({
        company: company,
        role: role || null,
        questions: questions || null,
        experience: experience,
        user_id: user.id,
        username: isAnon ? 'Anonymous' : getUsername(),
        is_anonymous: isAnon,
      });

      if (error) throw error;

      showToast('Experience shared! 🎉', 'success');
      area.querySelector('#share-company').value = '';
      area.querySelector('#share-role').value = '';
      area.querySelector('#share-questions').value = '';
      area.querySelector('#share-experience').value = '';
      loadPlacements(container);
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    }
  });
}

async function loadPlacements(container, companyFilter = '') {
  const grid = container.querySelector('#placement-grid');

  if (!isSupabaseConfigured()) {
    grid.innerHTML = `
      <div class="no-posts" style="grid-column: 1/-1;">
        <span class="icon">⚙️</span>
        <p>Configure Supabase to see placement experiences</p>
      </div>
    `;
    return;
  }

  try {
    let query = supabase
      .from('placements')
      .select('*')
      .order('created_at', { ascending: false });

    if (companyFilter) {
      query = query.ilike('company', `%${companyFilter}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = `
        <div class="no-posts">
          <span class="icon">💼</span>
          <p>${companyFilter ? 'No experiences found for that company' : 'No placement experiences shared yet. Be the first!'}</p>
        </div>
      `;
      // Clear companies list
      updateCompanyTags(container, []);
      return;
    }

    // Extract unique companies
    const companies = [...new Set(data.map((d) => d.company))];
    updateCompanyTags(container, companies);

    const user = getCurrentUser();
    grid.innerHTML = data.map((p) => {
      const canDelete = user && (user.id === p.user_id || isAdmin());
      const timeStr = new Date(p.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      return `
        <div class="glass-card placement-card">
          <div class="placement-card-header">
            <span class="company-name">${escapeHtml(p.company)}</span>
            ${p.role ? `<span class="company-role">${escapeHtml(p.role)}</span>` : ''}
          </div>
          ${p.questions ? `
            <div class="questions">
              <h4>📝 Questions Asked</h4>
              <p class="experience-text">${escapeHtml(p.questions)}</p>
            </div>
          ` : ''}
          <div class="experience-text">${escapeHtml(p.experience)}</div>
          <div class="post-meta">
            <span class="author">${p.is_anonymous ? '🎭 Anonymous' : p.username} • ${timeStr}</span>
            ${canDelete ? `<button class="btn btn-danger btn-small delete-placement-btn" data-id="${p.id}">🗑</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Delete buttons
    grid.querySelectorAll('.delete-placement-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this experience?')) return;
        try {
          await supabase.from('placements').delete().eq('id', btn.dataset.id);
          showToast('Deleted', 'success');
          loadPlacements(container, companyFilter);
        } catch (err) {
          showToast('Error: ' + err.message, 'error');
        }
      });
    });
  } catch (err) {
    grid.innerHTML = `<div class="no-posts"><p>Error: ${err.message}</p></div>`;
  }
}

function updateCompanyTags(container, companies) {
  const list = container.querySelector('#companies-list');
  if (companies.length === 0) {
    list.innerHTML = '';
    return;
  }
  list.innerHTML = companies.map((c) => `
    <span class="company-tag" data-company="${c}">${c}</span>
  `).join('');

  list.querySelectorAll('.company-tag').forEach((tag) => {
    tag.addEventListener('click', () => {
      const searchInput = container.querySelector('#company-search-input');
      searchInput.value = tag.dataset.company;
      loadPlacements(container, tag.dataset.company);

      list.querySelectorAll('.company-tag').forEach((t) => t.classList.remove('active'));
      tag.classList.add('active');
    });
  });
}

function initCompanySearch(container) {
  const input = container.querySelector('#company-search-input');
  let debounce = null;

  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      loadPlacements(container, input.value.trim());
    }, 300);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
