// KIIT KHOJ — Main Entry Point
import './styles/global.css';
import './styles/home.css';
import './styles/search.css';
import './styles/forum.css';
import './styles/placement.css';
import './styles/khazana.css';

import { initRouter } from './router.js';
import { renderNavbar } from './components/navbar.js';
import { initCursorEffects } from './components/cursor-effects.js';
import { initParticles } from './components/particles.js';
import { initAuth, showToast } from './components/auth.js';

import { renderHome } from './pages/home.js';
import { renderSearch } from './pages/search.js';
import { renderPlacement } from './pages/placement.js';
import { renderAdmin } from './pages/admin.js';
import { renderKhazana } from './pages/khazana.js';

// Global Anti-copy & Security measures (Immediate Lockdown)
const lockdown = () => {
  const block = (e) => {
    try {
      // Never block interactive elements (buttons, links, inputs)
      if (e.target.closest('input, textarea, button, a, .selectable, [role="button"]')) {
        return;
      }
      e.preventDefault();
      if (e.type === 'contextmenu' && typeof showToast === 'function') {
        showToast('Right-click is restricted.', 'info');
      }
    } catch (err) {}
  };

  // Block Right Click, Copy, Cut (Non-intrusive)
  ['contextmenu', 'copy', 'cut', 'dragstart'].forEach(event => {
    window.addEventListener(event, block, true);
  });

  // Block Shortcuts (Selective only)
  const handleKey = (e) => {
    try {
      const key = e.key.toUpperCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Only block 'DevTools' or 'Save' specific keys
      const isForbidden = 
        e.key === 'F12' ||
        (ctrl && ['U', 'S', 'P', 'J'].includes(key)) ||
        (ctrl && shift && ['I', 'J', 'C'].includes(key));

      if (isForbidden) {
        e.preventDefault();
        if (typeof showToast === 'function') {
          showToast('Developer tools are restricted.', 'info');
        }
      }
    } catch (err) {}
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
    '/khazana': renderKhazana,
    '/admin': renderAdmin,
  });

  // Register Service Worker AFTER page load to not interfere with Auth
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

init();
