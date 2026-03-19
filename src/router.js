export function initRouter(routes) {
  function navigate() {
    const hash = window.location.hash.slice(1) || '/';
    const app = document.getElementById('app');
    const route = routes[hash] || routes['/'];
    if (route) {
      route(app);
    }
  }

  window.addEventListener('hashchange', navigate);
  window.addEventListener('DOMContentLoaded', navigate);

  // Initial load
  navigate();
}

export function navigateTo(path) {
  window.location.hash = path;
}
