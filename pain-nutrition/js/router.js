/* Pain Nutrition — Router */
window.PNRouter = (function () {
  const ROUTES = {
    'home': window.renderHome, 'about': window.renderAbout,
    'features': window.renderFeatures, 'safety': window.renderSafety,
    'accessibility': window.renderAccessibility, 'partners': window.renderPartners,
    'contact': window.renderContact,
  };
  const DEFAULT = 'home';
  function navigate(route) {
    if (!ROUTES[route]) route = DEFAULT;
    if (window.location.hash !== '#' + route) { window.location.hash = route; return; }
    render(route);
  }
  function render(route) {
    const renderFn = ROUTES[route] || ROUTES[DEFAULT];
    const main = document.getElementById('site-main');
    if (!main) return;
    main.innerHTML = `<div class="page">${renderFn()}</div>`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelectorAll('[data-route]').forEach(el => el.classList.toggle('active', el.dataset.route === route));
    if (route === 'contact') {
      const form = document.getElementById('contact-form');
      const success = document.getElementById('form-success');
      if (form && success) {
        form.addEventListener('submit', (e) => {
          e.preventDefault(); form.style.display = 'none'; success.classList.add('visible');
          setTimeout(() => { form.reset(); form.style.display = ''; success.classList.remove('visible'); }, 6000);
        });
      }
    }
    main.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (!link) return;
      const r = link.dataset.route;
      if (r && ROUTES[r]) { e.preventDefault(); navigate(r); }
    });
  }
  function init() {
    PNComponents.initComponents();
    window.addEventListener('hashchange', () => render((window.location.hash.replace('#','').trim()) || DEFAULT));
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (!link) return;
      const r = link.dataset.route;
      if (r && ROUTES[r] && window.location.hash === '#' + r) { e.preventDefault(); render(r); }
    });
    render((window.location.hash.replace('#','').trim()) || DEFAULT);
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
  return { navigate, render };
})();
