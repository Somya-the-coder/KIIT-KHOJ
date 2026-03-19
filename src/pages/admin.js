import { supabase, isSupabaseConfigured } from '../supabase.js';
import { getCurrentUser, isAdmin, showToast } from '../components/auth.js';
import { navigateTo } from '../router.js';

export function renderAdmin(container) {
  const user = getCurrentUser();

  if (!user || !isAdmin()) {
    container.innerHTML = `
      <div class="admin-page" style="text-align:center; padding-top: 200px;">
        <h1>🔒 Access Denied</h1>
        <p style="color: var(--text-secondary); margin-top: 12px;">This page is only accessible to the administrator.</p>
        <button class="btn btn-primary" style="margin-top: 20px;" onclick="window.location.hash='/'">Go Home</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <h1 class="glow-text">⚙️ Admin Dashboard</h1>
        <p>Manage KIIT KHOJ — Users, PDFs, Discussions, Placements</p>
      </div>

      <div class="admin-stats" id="admin-stats">
        <div class="glass-card admin-stat">
          <div class="stat-number" id="stat-users">-</div>
          <div class="stat-label">Registered Users</div>
        </div>
        <div class="glass-card admin-stat">
          <div class="stat-number" id="stat-pdfs">-</div>
          <div class="stat-label">PDFs Uploaded</div>
        </div>
        <div class="glass-card admin-stat">
          <div class="stat-number" id="stat-discussions">-</div>
          <div class="stat-label">Discussion Posts</div>
        </div>
        <div class="glass-card admin-stat">
          <div class="stat-number" id="stat-placements">-</div>
          <div class="stat-label">Placement Entries</div>
        </div>
      </div>

      <!-- User Emails -->
      <div class="admin-section">
        <h2>👥 Registered Users (Email IDs)</h2>
        <div id="users-table-container">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Recent PDFs -->
      <div class="admin-section">
        <h2>📄 Uploaded PDFs</h2>
        <div id="pdfs-table-container">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Recent Discussions -->
      <div class="admin-section">
        <h2>💬 Recent Discussions</h2>
        <div id="discussions-table-container">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Recent Placements -->
      <div class="admin-section">
        <h2>💼 Recent Placements</h2>
        <div id="placements-table-container">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  `;

  loadAdminData(container);
}

async function loadAdminData(container) {
  if (!isSupabaseConfigured()) {
    container.querySelector('#users-table-container').innerHTML = '<p style="color:var(--text-muted);">Configure Supabase first</p>';
    return;
  }

  try {
    // Load PDFs
    const { data: pdfs, error: pdfsError } = await supabase
      .from('pdfs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!pdfsError && pdfs) {
      container.querySelector('#stat-pdfs').textContent = pdfs.length;

      // Extract unique user emails from PDFs
      const emails = [...new Set(pdfs.map(p => p.uploader_email).filter(Boolean))];

      container.querySelector('#pdfs-table-container').innerHTML = pdfs.length ? `
        <table class="admin-table glass-card">
          <thead><tr><th>Subject</th><th>File</th><th>Uploader</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            ${pdfs.map(p => `
              <tr>
                <td>${p.subject}</td>
                <td><a href="${p.file_url}" target="_blank">${p.file_name}</a></td>
                <td>${p.uploader_email || 'N/A'}</td>
                <td>${new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                <td><button class="btn btn-danger btn-small admin-delete-pdf" data-id="${p.id}" data-path="${p.file_name}">🗑</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color:var(--text-muted);">No PDFs uploaded yet</p>';

      // Delete PDF handlers
      container.querySelectorAll('.admin-delete-pdf').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this PDF?')) return;
          try {
            await supabase.storage.from('pdfs').remove([`pdfs/${btn.dataset.path}`]);
            await supabase.from('pdfs').delete().eq('id', btn.dataset.id);
            showToast('PDF deleted', 'success');
            loadAdminData(container);
          } catch (err) { showToast('Error: ' + err.message, 'error'); }
        });
      });
    }

    // Load discussions
    const { data: discussions, error: discError } = await supabase
      .from('discussions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!discError && discussions) {
      container.querySelector('#stat-discussions').textContent = discussions.length;
      container.querySelector('#discussions-table-container').innerHTML = discussions.length ? `
        <table class="admin-table glass-card">
          <thead><tr><th>Subject</th><th>User</th><th>Content</th><th>Anonymous</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            ${discussions.map(d => `
              <tr>
                <td>${d.subject}</td>
                <td>${d.username}</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(d.content)}</td>
                <td>${d.is_anonymous ? '✅' : '❌'}</td>
                <td>${new Date(d.created_at).toLocaleDateString('en-IN')}</td>
                <td><button class="btn btn-danger btn-small admin-delete-disc" data-id="${d.id}">🗑</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color:var(--text-muted);">No discussions yet</p>';

      container.querySelectorAll('.admin-delete-disc').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete?')) return;
          try {
            await supabase.from('discussions').delete().eq('id', btn.dataset.id);
            showToast('Deleted', 'success');
            loadAdminData(container);
          } catch (err) { showToast('Error: ' + err.message, 'error'); }
        });
      });
    }

    // Load placements
    const { data: placements, error: placError } = await supabase
      .from('placements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!placError && placements) {
      container.querySelector('#stat-placements').textContent = placements.length;
      container.querySelector('#placements-table-container').innerHTML = placements.length ? `
        <table class="admin-table glass-card">
          <thead><tr><th>Company</th><th>Role</th><th>User</th><th>Anonymous</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            ${placements.map(p => `
              <tr>
                <td>${escapeHtml(p.company)}</td>
                <td>${p.role ? escapeHtml(p.role) : '-'}</td>
                <td>${p.username}</td>
                <td>${p.is_anonymous ? '✅' : '❌'}</td>
                <td>${new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                <td><button class="btn btn-danger btn-small admin-delete-plac" data-id="${p.id}">🗑</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color:var(--text-muted);">No placements yet</p>';

      container.querySelectorAll('.admin-delete-plac').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete?')) return;
          try {
            await supabase.from('placements').delete().eq('id', btn.dataset.id);
            showToast('Deleted', 'success');
            loadAdminData(container);
          } catch (err) { showToast('Error: ' + err.message, 'error'); }
        });
      });
    }

    // Users = unique emails from all tables
    const allEmails = new Set();
    if (pdfs) pdfs.forEach(p => { if (p.uploader_email) allEmails.add(p.uploader_email); });

    container.querySelector('#stat-users').textContent = allEmails.size || '0';
    container.querySelector('#users-table-container').innerHTML = allEmails.size ? `
      <table class="admin-table glass-card">
        <thead><tr><th>#</th><th>Email ID</th></tr></thead>
        <tbody>
          ${[...allEmails].map((email, i) => `
            <tr><td>${i + 1}</td><td>${email}</td></tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="color:var(--text-muted);">No user data yet. Users appear after they upload PDFs.</p>';

  } catch (err) {
    showToast('Error loading admin data: ' + err.message, 'error');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
