import { getCurrentUser, isAdmin, getUsername, signIn, signOut, onAuthChange } from './auth.js';
import { navigateTo } from '../router.js';

export function renderNavbar() {
  const nav = document.createElement('nav');
  nav.className = 'navbar no-select';
  nav.innerHTML = `
    <div class="nav-inner">
      <div class="nav-logo" id="nav-logo">KIIT KHOJ</div>
      <button class="nav-hamburger" id="nav-hamburger">☰</button>
      <div class="nav-links" id="nav-links">
        <button class="nav-link" data-route="/">🏠 Home</button>
        <button class="nav-link" data-route="/search">🔍 Search PYQs</button>
        <button class="nav-link" data-route="/placements">💼 Placements</button>
        <button class="nav-link admin-link" data-route="/admin" style="display:none;">⚙️ Admin</button>
      </div>
      <div class="nav-auth" id="nav-auth"></div>
    </div>
  `;

  // Logo click
  nav.querySelector('#nav-logo').addEventListener('click', () => navigateTo('/'));

  // Hamburger
  nav.querySelector('#nav-hamburger').addEventListener('click', () => {
    nav.querySelector('#nav-links').classList.toggle('open');
  });

  // Nav links
  nav.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      navigateTo(link.dataset.route);
      nav.querySelector('#nav-links').classList.remove('open');
    });
  });

  // Update active link
  function updateActive() {
    const hash = window.location.hash.slice(1) || '/';
    nav.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.route === hash);
    });
  }
  window.addEventListener('hashchange', updateActive);
  updateActive();

  // Auth state
  function updateAuth(user) {
    const authDiv = nav.querySelector('#nav-auth');
    const adminLink = nav.querySelector('.admin-link');

    if (user) {
      const username = getUsername();
      const initial = username ? username[0].toUpperCase() : '?';
      authDiv.innerHTML = `
        <div class="nav-user">
          <div class="nav-user-avatar">${initial}</div>
          <span>${username}</span>
        </div>
        <button class="btn btn-secondary btn-small" id="logout-btn">Logout</button>
      `;
      authDiv.querySelector('#logout-btn').addEventListener('click', signOut);

      if (isAdmin()) {
        adminLink.style.display = '';
      } else {
        adminLink.style.display = 'none';
      }
    } else {
      authDiv.innerHTML = `
        <button class="btn btn-primary btn-small" id="login-btn">🔐 Login with KIIT Mail</button>
      `;
      authDiv.querySelector('#login-btn').addEventListener('click', signIn);
      adminLink.style.display = 'none';
    }
  }

  onAuthChange(updateAuth);
  updateAuth(getCurrentUser());

  return nav;
}
