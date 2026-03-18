/* REPLACE: Rename window.VentureRouter to window.{{VENTURE_SLUG}}Router */
window.VentureRouter = (function () {

  /* REPLACE: Add or remove routes to match your page set.
     Keys must match href="#route" values in index.html.
     Values must match window.render* functions in pages/*.js. */
  const ROUTES = {
    'home':          window.renderHome,
    'about':         window.renderAbout,
    'features':      window.renderFeatures,   // REPLACE: rename key if you renamed this page
    'safety':        window.renderSafety,     // REPLACE: rename key if you renamed this page
    'accessibility': window.renderAccessibility,
    'partners':      window.renderPartners,
    'contact':       window.renderContact,
  };

  const DEFAULT_ROUTE = 'home';
  const main  = document.getElementById('site-main');
  const footer = document.getElementById('site-footer');
  const C = window.VentureComponents; /* REPLACE: window.{{VENTURE_SLUG}}Components */

  function getRoute() {
    const hash = window.location.hash.replace('#', '').trim();
    return ROUTES[hash] ? hash : DEFAULT_ROUTE;
  }

  function updateNavState(route) {
    document.querySelectorAll('[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });
  }

  function closeMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger) { hamburger.setAttribute('aria-expanded', 'false'); hamburger.classList.remove('open'); }
    if (mobileMenu) { mobileMenu.classList.remove('open'); mobileMenu.setAttribute('aria-hidden', 'true'); }
  }

  function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (!hamburger || !mobileMenu) return;
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.classList.toggle('open', isOpen);
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    });
    mobileMenu.querySelectorAll('[data-route]').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  function initContactForm() {
    const form    = document.getElementById('contact-form');
    const success = document.getElementById('form-success');
    if (!form || !success) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      form.style.display = 'none';
      success.style.display = 'block';
      setTimeout(() => {
        success.style.display = 'none';
        form.style.display = 'block';
        form.reset();
      }, 6000);
    });
  }

  function handleMainClick(e) {
    const link = e.target.closest('[data-route]');
    if (!link) return;
    const route = link.dataset.route;
    if (!ROUTES[route]) return;
    e.preventDefault();
    window.location.hash = route;
    closeMobileMenu();
  }

  function render() {
    const route = getRoute();
    updateNavState(route);

    const renderFn = ROUTES[route];
    if (!renderFn) return;

    main.innerHTML = renderFn() + C.renderFooter();
    C.initComponents();
    initContactForm();

    main.addEventListener('click', handleMainClick, { once: true });

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function init() {
    initHamburger();
    render();
    window.addEventListener('hashchange', render);
  }

  document.addEventListener('DOMContentLoaded', init);

  return { navigate: (r) => { window.location.hash = r; } };

})();
