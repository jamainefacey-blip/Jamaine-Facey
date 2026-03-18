/* ─────────────────────────────────────────────────────────────────────────────
   Fraud Help Index — Router
   Hash-based SPA. Maps routes to page render functions.
   ───────────────────────────────────────────────────────────────────────────── */

window.FHIRouter = (function () {

  const ROUTES = {
    'home':          window.renderHome,
    'about':         window.renderAbout,
    'fraud-types':   window.renderFraudTypes,
    'prevention':    window.renderPrevention,
    'accessibility': window.renderAccessibility,
    'partners':      window.renderPartners,
    'contact':       window.renderContact,
  };

  const DEFAULT_ROUTE = 'home';
  let currentRoute = null;

  function navigate(route) {
    if (!ROUTES[route]) route = DEFAULT_ROUTE;
    if (window.location.hash !== '#' + route) { window.location.hash = route; return; }
    render(route);
  }

  function render(route) {
    currentRoute = route;
    const renderFn = ROUTES[route] || ROUTES[DEFAULT_ROUTE];
    const main = document.getElementById('site-main');
    if (!main) return;
    main.innerHTML = `<div class="page">${renderFn()}</div>`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    updateNavState(route);
    initPageInteractions(route);
  }

  function updateNavState(route) {
    document.querySelectorAll('[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });
  }

  function initPageInteractions(route) {
    if (route === 'contact') {
      const form    = document.getElementById('contact-form');
      const success = document.getElementById('form-success');
      if (form && success) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          form.style.display = 'none';
          success.classList.add('visible');
          setTimeout(() => {
            form.reset();
            form.style.display = '';
            success.classList.remove('visible');
          }, 6000);
        });
      }
    }
    document.getElementById('site-main').addEventListener('click', handleMainClick);
  }

  function handleMainClick(e) {
    const link = e.target.closest('[data-route]');
    if (!link) return;
    const route = link.dataset.route;
    if (route && ROUTES[route]) { e.preventDefault(); navigate(route); }
  }

  function parseHash() {
    return window.location.hash.replace('#', '').trim() || DEFAULT_ROUTE;
  }

  function init() {
    FHIComponents.initComponents();
    window.addEventListener('hashchange', () => render(parseHash()));
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (!link) return;
      const route = link.dataset.route;
      if (route && ROUTES[route] && window.location.hash === '#' + route) {
        e.preventDefault(); render(route);
      }
    });
    render(parseHash());
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }

  return { navigate, render };

})();
