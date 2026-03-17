/**
 * Pain System — Lightweight hash-based SPA router.
 * No framework dependencies.
 */

const Router = {
  routes: {},
  currentRoute: null,

  register(path, loader) {
    this.routes[path] = loader;
  },

  async navigate(path) {
    if (path === this.currentRoute) return;
    this.currentRoute = path;

    const loader = this.routes[path] || this.routes['/'];
    const app = document.getElementById('app');

    if (loader) {
      const html = typeof loader === 'function' ? await loader() : loader;
      app.innerHTML = html;
      window.scrollTo(0, 0);
      this.updateActiveNav(path);
    }
  },

  updateActiveNav(path) {
    document.querySelectorAll('.site-nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === '#' + path || (path === '/' && href === '#/')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  init() {
    window.addEventListener('hashchange', () => {
      const path = location.hash.slice(1) || '/';
      this.navigate(path);
    });

    const path = location.hash.slice(1) || '/';
    this.navigate(path);
  },
};

window.Router = Router;
