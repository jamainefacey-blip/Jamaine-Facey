/* ═══════════════════════════════════════════════════════════════
   Voyage Smart Travel — Premium JS v3
   Nav · Parallax · Carousel · Eco · Reveals · Planner · Filter
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Nav: scroll class + mobile menu ────────────────────────── */
  var nav = document.querySelector('.vst-nav');
  var burger = document.getElementById('nav-burger');
  var mobileMenu = document.getElementById('nav-mobile');

  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var isOpen = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Active nav link ─────────────────────────────────────────── */
  var path = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-link').forEach(function (a) {
    var href = (a.getAttribute('href') || '').replace(/\/$/, '') || '/';
    if (href === path || (path === '/' && href === '/index.html')) {
      a.classList.add('active');
    }
  });

  /* ── Parallax hero background ────────────────────────────────── */
  var heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y < window.innerHeight * 1.5) {
        heroBg.style.transform = 'translateY(' + (y * 0.32) + 'px)';
      }
    }, { passive: true });
  }

  /* ── Carousel ─────────────────────────────────────────────────── */
  var track = document.querySelector('.carousel-track');
  if (track) {
    var prevBtn = document.getElementById('carousel-prev');
    var nextBtn = document.getElementById('carousel-next');

    function cardWidth() {
      var c = track.querySelector('.dest-card');
      if (!c) return 320 + 20;
      return c.getBoundingClientRect().width + 20;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        track.scrollBy({ left: -cardWidth() * 2, behavior: 'smooth' });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        track.scrollBy({ left: cardWidth() * 2, behavior: 'smooth' });
      });
    }
  }

  /* ── Eco score bars — animate into view ──────────────────────── */
  function animateEcoBars() {
    document.querySelectorAll('.eco-fill[data-w]').forEach(function (bar) {
      if (bar.dataset.animated) return;
      var card = bar.closest('.trip-card') || bar.closest('.dgrid-card');
      if (!card) return;
      var rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) {
        bar.style.width = bar.dataset.w + '%';
        bar.dataset.animated = '1';
      }
    });
  }
  window.addEventListener('scroll', animateEcoBars, { passive: true });
  setTimeout(animateEcoBars, 100);

  /* ── Scroll-reveal with stagger (IntersectionObserver) ──────── */
  var revealSelectors = ['.trip-card', '.feat-card', '.stat-item', '.dgrid-card', '.value-card'];
  var revealCandidates = [];
  revealSelectors.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.classList.add('reveal-item');
      revealCandidates.push(el);
    });
  });

  if (revealCandidates.length && 'IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      visible.forEach(function (entry, i) {
        setTimeout(function () {
          entry.target.classList.add('is-visible');
        }, i * 90);
        revealObs.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealCandidates.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealCandidates.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ── Keyboard activation for tabindex=0 cards ───────────────── */
  document.querySelectorAll('[tabindex="0"][data-tags], .dest-card[tabindex="0"]').forEach(function (card) {
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var link = card.querySelector('a');
        if (link) link.click();
        else card.click();
      }
    });
  });

  /* ── AVA hero search bar ─────────────────────────────────────── */
  var heroInput = document.querySelector('.ava-search-input');
  var heroBtn   = document.querySelector('.ava-search-btn');

  function goToPlanner(q) {
    window.location.href = '/planner' + (q ? '?q=' + encodeURIComponent(q) : '');
  }

  if (heroInput) {
    heroInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') goToPlanner(heroInput.value.trim());
    });
  }
  if (heroBtn) {
    heroBtn.addEventListener('click', function () {
      goToPlanner(heroInput ? heroInput.value.trim() : '');
    });
  }

  document.querySelectorAll('.ava-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (heroInput) {
        heroInput.value = chip.textContent.trim();
        heroInput.focus();
      } else {
        goToPlanner(chip.textContent.trim());
      }
    });
  });

  /* ── Destination filter (destinations.html) ──────────────────── */
  var filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var filter = btn.dataset.filter || 'all';
        document.querySelectorAll('.dgrid-card').forEach(function (card) {
          var tags = (card.dataset.tags || '').toLowerCase();
          var show = filter === 'all' || tags.indexOf(filter) !== -1;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ── AVA Planner chat (planner.html) ─────────────────────────── */
  var plannerInput = document.getElementById('planner-input');
  var plannerSend  = document.getElementById('planner-send');
  var chatWrap     = document.getElementById('chat-wrap');
  var typingEl     = document.getElementById('typing-indicator');

  if (plannerInput && plannerSend && chatWrap) {
    var avaReplies = [
      "I'm on it. Scanning flights, carbon offsets, and local experiences across 47 providers — give me a moment.",
      "Found some great options. For that route the most eco-friendly choice is a train leg via Paris — cuts emissions by 73% vs. flying. Want me to build the full itinerary around that?",
      "Perfect. I've put together a 7-day itinerary with an eco score of 91/100. It includes zero-emission transfers, locally-owned stays, and three curated experiences. Ready to review it?",
      "Great — I'll hold these options while you decide. You can also ask me to adjust dates, swap hotels, or find alternatives within your budget."
    ];
    var replyIdx = 0;

    function showTyping() {
      if (!typingEl) return;
      chatWrap.appendChild(typingEl);
      typingEl.style.display = 'flex';
      chatWrap.scrollTop = chatWrap.scrollHeight;
    }

    function hideTyping() {
      if (!typingEl) return;
      typingEl.style.display = 'none';
    }

    function addMsg(text, type, delay) {
      setTimeout(function () {
        if (type === 'ava') hideTyping();

        var wrap = document.createElement('div');
        wrap.className = 'chat-msg ' + type;
        if (type === 'ava') {
          var lbl = document.createElement('div');
          lbl.className = 'chat-label';
          lbl.textContent = 'AVA';
          wrap.appendChild(lbl);
        }
        var bubble = document.createElement('div');
        bubble.className = 'chat-bubble ' + type;
        bubble.textContent = text;
        wrap.appendChild(bubble);
        chatWrap.appendChild(wrap);
        chatWrap.scrollTop = chatWrap.scrollHeight;
      }, delay || 0);
    }

    function sendMsg() {
      var text = plannerInput.value.trim();
      if (!text) return;
      addMsg(text, 'user');
      plannerInput.value = '';
      plannerInput.style.height = '';

      setTimeout(showTyping, 300);

      if (replyIdx < avaReplies.length) {
        addMsg(avaReplies[replyIdx++], 'ava', 1200);
      }
    }

    plannerSend.addEventListener('click', sendMsg);
    plannerInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });

    plannerInput.addEventListener('input', function () {
      this.style.height = '';
      this.style.height = Math.min(this.scrollHeight, 140) + 'px';
    });

    document.querySelectorAll('.ava-sug-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        plannerInput.value = chip.textContent.trim();
        plannerInput.focus();
      });
    });

    var q = new URLSearchParams(location.search).get('q');
    if (q) {
      plannerInput.value = q;
      setTimeout(sendMsg, 700);
    }
  }

  /* ── Smooth scroll for #anchor links ────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
