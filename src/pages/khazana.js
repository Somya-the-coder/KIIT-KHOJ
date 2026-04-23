import { supabase, isSupabaseConfigured, ADMIN_EMAIL } from '../supabase.js';
import { getCurrentUser, isAdmin, showToast } from '../components/auth.js';

let currentSemester = 1;

export function renderKhazana(container) {
  const user = getCurrentUser();

  if (!user) {
    container.innerHTML = `
      <div class="khazana-page fade-in" style="padding-top: 100px;">
        <div class="glass-card restricted-card" style="max-width: 500px; margin: 40px auto; padding: 40px; text-align: center;">
          <div class="restricted-icon" style="font-size: 3rem; margin-bottom: 20px;">🔒</div>
          <h1 class="glow-text">Members Only</h1>
          <p style="margin-bottom: 25px;">Please login with your <strong>KIIT Mail</strong> to access the treasure trove of study materials.</p>
          <button class="btn btn-primary" id="khazana-login-btn">🔐 Login with KIIT Mail</button>
        </div>
      </div>
    `;
    container.querySelector('#khazana-login-btn').addEventListener('click', signIn);
    return;
  }

  container.innerHTML = `
    <div class="khazana-page fade-in">
      <div class="khazana-header">
        <h1 class="glow-text">💎 The Real Khazana</h1>
        <p>Your ultimate treasure of semester-wise study materials & resources</p>
      </div>

      <!-- Global Search -->
      <div class="search-container khazana-search">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" id="khazana-search-input"
                 placeholder="Search materials across all semesters..."
                 autocomplete="off" />
        </div>
        <div class="autocomplete-dropdown" id="khazana-dropdown"></div>
      </div>

      <!-- Semester Tabs -->
      <div class="semester-tabs">
        ${[1, 2, 3, 4, 5, 6, 7, 8].map(sem => `
          <button class="sem-tab ${sem === currentSemester ? 'active' : ''}" data-sem="${sem}">
            Sem ${sem}
          </button>
        `).join('')}
      </div>

      <!-- Admin Upload Section -->
      ${isAdmin() ? `
        <div class="admin-upload-section glass-card">
          <h3>📤 Admin Upload (Khazana)</h3>
          <div class="upload-controls">
            <div class="upload-mode">
              <label><input type="radio" name="upload-type" value="file" checked> File</label>
              <label><input type="radio" name="upload-type" value="folder"> Folder</label>
            </div>
            <input type="file" id="khazana-file-input" style="display:none;" />
            <input type="file" id="khazana-folder-input" webkitdirectory directory style="display:none;" />
            <button class="btn btn-secondary" id="select-files-btn">📂 Select Files/Folder</button>
            <div id="upload-queue-info"></div>
            <button class="btn btn-primary" id="start-upload-btn" style="display:none;">🚀 Start Upload</button>
          </div>
        </div>
      ` : ''}

      <!-- Materials List -->
      <div class="materials-grid" id="materials-grid">
        <div class="spinner"></div>
      </div>

      <!-- Preview Modal -->
      <div id="preview-modal" class="modal">
        <div class="modal-content glass-card">
          <div class="modal-header">
            <h3 id="preview-title">Preview</h3>
            <button class="close-btn">&times;</button>
          </div>
          <div id="preview-body"></div>
        </div>
      </div>
    </div>
  `;

  initSemesterTabs(container);
  initSearch(container);
  if (isAdmin()) initUpload(container);
  loadMaterials(currentSemester, container);
}

function initSemesterTabs(container) {
  container.querySelectorAll('.sem-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.sem-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentSemester = parseInt(tab.dataset.sem);
      loadMaterials(currentSemester, container);
    });
  });
}

function initSearch(container) {
  const input = container.querySelector('#khazana-search-input');
  const dropdown = container.querySelector('#khazana-dropdown');

  input.addEventListener('input', async () => {
    const query = input.value.trim();
    if (query.length < 2) {
      dropdown.classList.remove('active');
      return;
    }

    const { data, error } = await supabase
      .from('khazana')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (data && data.length > 0) {
      dropdown.innerHTML = data.map(item => `
        <div class="autocomplete-item" data-id="${item.id}" data-sem="${item.semester}">
          <span class="subject-name">${item.name}</span>
          <span class="subject-abbr">Sem ${item.semester}</span>
        </div>
      `).join('');
      dropdown.classList.add('active');

      dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          currentSemester = parseInt(item.dataset.sem);
          dropdown.classList.remove('active');
          input.value = item.querySelector('.subject-name').textContent;
          // Refresh grid to show this item or its sem
          loadMaterials(currentSemester, container);
        });
      });
    } else {
      dropdown.classList.remove('active');
    }
  });
}

async function loadMaterials(sem, container) {
  const grid = container.querySelector('#materials-grid');
  grid.innerHTML = '<div class="spinner"></div>';

  if (!isSupabaseConfigured()) {
    grid.innerHTML = '<p>Supabase not configured.</p>';
    return;
  }

  try {
    const { data, error } = await supabase
      .from('khazana')
      .select('*')
      .eq('semester', sem)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = `<div class="no-materials">📭 No materials in Semester ${sem} yet.</div>`;
      return;
    }

    grid.innerHTML = `
      <div class="materials-list">
        ${data.map(item => `
          <div class="material-item glass-card">
            <div class="material-info">
              <span class="icon">${item.type === 'folder' ? '📁' : '📄'}</span>
              <span class="name">${item.name}</span>
            </div>
            <div class="material-actions">
              <button class="btn btn-secondary btn-small preview-khazana-btn" data-url="${item.file_url}" data-name="${item.name}">👁 Preview</button>
              ${isAdmin() ? `<button class="btn btn-danger btn-small delete-khazana-btn" data-id="${item.id}" data-path="${item.file_path}">🗑</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Preview
    grid.querySelectorAll('.preview-khazana-btn').forEach(btn => {
      btn.addEventListener('click', () => openPreview(btn.dataset.url, btn.dataset.name, container));
    });

    // Delete
    if (isAdmin()) {
      grid.querySelectorAll('.delete-khazana-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this material?')) return;
          try {
            await supabase.storage.from('khazana').remove([btn.dataset.path]);
            await supabase.from('khazana').delete().eq('id', btn.dataset.id);
            showToast('Deleted from Khazana', 'success');
            loadMaterials(sem, container);
          } catch (err) {
            showToast('Error: ' + err.message, 'error');
          }
        });
      });
    }

  } catch (err) {
    grid.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

function openPreview(url, name, container) {
  const modal = container.querySelector('#preview-modal');
  const body = container.querySelector('#preview-body');
  const title = container.querySelector('#preview-title');

  title.textContent = name;
  body.innerHTML = `<iframe src="${url}" style="width:100%; height:70vh; border:none;" title="Preview"></iframe>`;
  modal.style.display = 'block';

  modal.querySelector('.close-btn').onclick = () => {
    modal.style.display = 'none';
    body.innerHTML = '';
  };
}

function initUpload(container) {
  const fileInput = container.querySelector('#khazana-file-input');
  const folderInput = container.querySelector('#khazana-folder-input');
  const selectBtn = container.querySelector('#select-files-btn');
  const startBtn = container.querySelector('#start-upload-btn');
  const info = container.querySelector('#upload-queue-info');
  let selectedFiles = [];

  selectBtn.onclick = () => {
    const isFolder = container.querySelector('input[name="upload-type"]:checked').value === 'folder';
    if (isFolder) folderInput.click();
    else fileInput.click();
  };

  const handleFiles = (files) => {
    selectedFiles = Array.from(files);
    info.textContent = `${selectedFiles.length} item(s) selected.`;
    startBtn.style.display = selectedFiles.length > 0 ? 'inline-block' : 'none';
  };

  fileInput.onchange = () => handleFiles(fileInput.files);
  folderInput.onchange = () => handleFiles(folderInput.files);

  startBtn.onclick = async () => {
    startBtn.disabled = true;
    startBtn.textContent = 'Uploading...';

    for (const file of selectedFiles) {
      try {
        const isFolderMode = container.querySelector('input[name="upload-type"]:checked').value === 'folder';
        const fileName = isFolderMode ? (file.webkitRelativePath || file.name) : file.name;
        const filePath = `sem${currentSemester}/${Date.now()}_${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('khazana').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('khazana').getPublicUrl(filePath);

        await supabase.from('khazana').insert({
          name: fileName,
          type: isFolderMode ? 'folder' : 'file',
          file_url: urlData.publicUrl,
          file_path: filePath,
          semester: currentSemester,
          uploader_email: ADMIN_EMAIL
        });
      } catch (err) {
        showToast(`Failed to upload ${file.name}: ${err.message}`, 'error');
      }
    }

    showToast('Upload complete!', 'success');
    startBtn.disabled = false;
    startBtn.textContent = '🚀 Start Upload';
    startBtn.style.display = 'none';
    info.textContent = '';
    loadMaterials(currentSemester, container);
  };
}
