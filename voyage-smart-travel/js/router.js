/* ─────────────────────────────────────────────────────────────────────────────
   Voyage Smart Travel — Hash Router
   Hash-based SPA routing. Maps #routes to page render functions.
   Pattern: same as thepainsystem-org rehab-client, adapted for marketing site.
   ───────────────────────────────────────────────────────────────────────────── */

window.VSTRouter = (function () {

  /* ── Route map ────────────────────────────────────────────────────────────── */
  const ROUTES = {
    'home':          window.renderHome,
    'about':         window.renderAbout,
    'safety':        window.renderSafety,
    'features':      window.renderFeatures,
    'accessibility': window.renderAccessibility,
    'partners':      window.renderPartners,
    'contact':       window.renderContact,
  };

  const DEFAULT_ROUTE = 'home';

  /* ── State ────────────────────────────────────────────────────────────────── */
  let currentRoute = null;

  /* ── navigate ─────────────────────────────────────────────────────────────── */
  function navigate(route) {
    if (!ROUTES[route]) route = DEFAULT_ROUTE;

    // Update URL hash
    if (window.location.hash !== '#' + route) {
      window.location.hash = route;
      return; // hashchange event will re-trigger navigate
    }

    // Same route — force re-render
    render(route);
  }

  /* ── render ───────────────────────────────────────────────────────────────── */
  function render(route) {
    currentRoute = route;
    const renderFn = ROUTES[route] || ROUTES[DEFAULT_ROUTE];

    const main = document.getElementById('site-main');
    if (!main) return;

    // Render page content
    main.innerHTML = `<div class="page">${renderFn()}</div>`;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Update active nav links
    updateNavState(route);

    // Init page-specific interactions
    initPageInteractions(route);
  }

  /* ── updateNavState ───────────────────────────────────────────────────────── */
  function updateNavState(route) {
    document.querySelectorAll('[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });
  }

  /* ── initPageInteractions ─────────────────────────────────────────────────── */
  function initPageInteractions(route) {
    // Contact form submission
    if (route === 'contact') {
      const form = document.getElementById('contact-form');
      const success = document.getElementById('form-success');
      if (form && success) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          form.style.display = 'none';
          success.classList.add('visible');
          // Reset after 6s
          setTimeout(() => {
            form.reset();
            form.style.display = '';
            success.classList.remove('visible');
          }, 6000);
        });
      }
    }

    // Any in-page data-route links (inside rendered pages)
    document.getElementById('site-main').addEventListener('click', handleMainClick);
  }

  /* ── handleMainClick ──────────────────────────────────────────────────────── */
  function handleMainClick(e) {
    const link = e.target.closest('[data-route]');
    if (!link) return;
    const route = link.dataset.route;
    if (route && ROUTES[route]) {
      e.preventDefault();
      navigate(route);
    }
  }

  /* ── parseHash ────────────────────────────────────────────────────────────── */
  function parseHash() {
    const hash = window.location.hash.replace('#', '').trim();
    return hash || DEFAULT_ROUTE;
  }

  /* ── init ─────────────────────────────────────────────────────────────────── */
  function init() {
    // Init shared components (footer, hamburger)
    VSTComponents.initComponents();

    // Handle hash changes
    window.addEventListener('hashchange', () => {
      render(parseHash());
    });

    // Also handle clicks on header nav (non-hash links using data-route)
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (!link) return;
      const route = link.dataset.route;
      if (route && ROUTES[route]) {
        // Let the hashchange handle it via href="#route"
        // But force render if hash already matches
        if (window.location.hash === '#' + route) {
          e.preventDefault();
          render(route);
        }
      }
    });

    // Initial render
    render(parseHash());
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { navigate, render };

})();
