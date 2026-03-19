// KIIT KHOJ — Main Entry Point
import './styles/global.css';
import './styles/home.css';
import './styles/search.css';
import './styles/forum.css';
import './styles/placement.css';

import { initRouter } from './router.js';
import { renderNavbar } from './components/navbar.js';
import { initCursorEffects } from './components/cursor-effects.js';
import { initParticles } from './components/particles.js';
import { initAuth } from './components/auth.js';

import { renderHome } from './pages/home.js';
import { renderSearch } from './pages/search.js';
import { renderPlacement } from './pages/placement.js';
import { renderAdmin } from './pages/admin.js';

// Initialize
async function init() {
  // Add navbar
  const app = document.getElementById('app');
  const navbar = renderNavbar();
  document.body.insertBefore(navbar, app);

  // Initialize auth
  await initAuth();

  // Initialize visual effects
  initParticles();
  initCursorEffects();

  // Setup router
  initRouter({
    '/': renderHome,
    '/search': renderSearch,
    '/placements': renderPlacement,
    '/admin': renderAdmin,
  });

  // Anti-copy measures
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.no-select')) {
      e.preventDefault();
    }
  });

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

init();
