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
import { initAuth, showToast } from './components/auth.js';

import { renderHome } from './pages/home.js';
import { renderSearch } from './pages/search.js';
import { renderPlacement } from './pages/placement.js';
import { renderAdmin } from './pages/admin.js';

// Global Anti-copy & Security measures (Immediate Lockdown)
const lockdown = () => {
  const block = (e) => {
    try {
      if (!e.target.closest('input, textarea, .selectable')) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof showToast === 'function') {
          showToast('Action restricted for security.', 'info');
        }
        return false;
      }
    } catch (err) {
      e.preventDefault();
    }
  };

  // Block Right Click (Window, Document, and Root)
  ['contextmenu', 'copy', 'cut', 'dragstart'].forEach(event => {
    window.addEventListener(event, block, true);
    document.addEventListener(event, block, true);
    document.documentElement.addEventListener(event, block, true);
  });

  // Block Shortcuts
  const handleKey = (e) => {
    try {
      const key = e.key.toUpperCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      const isForbidden = 
        e.key === 'F12' ||
        (ctrl && ['U', 'S', 'P', 'J', 'C'].includes(key)) ||
        (ctrl && shift && ['I', 'J', 'C'].includes(key));

      if (isForbidden) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof showToast === 'function') {
          showToast('Developer tools are restricted.', 'info');
        }
        return false;
      }
    } catch (err) {
      e.preventDefault();
    }
  };

  window.addEventListener('keydown', handleKey, true);
  document.addEventListener('keydown', handleKey, true);

  // Visibility guard
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? '🔒 KIIT KHOJ Locked' : 'KIIT KHOJ — Ultimate PYQ Portal';
  }, true);
};

// Start Lockdown immediately
lockdown();

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

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

init();
