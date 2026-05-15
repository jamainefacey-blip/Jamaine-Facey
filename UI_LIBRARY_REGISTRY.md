# PAIN SYSTEM — UI LIBRARY REGISTRY
# Standing reference for all Pain System frontend builds (VST + future lanes)
# Reference this file first before any UI build prompt.

---

## Registry Version

`1.0.0` — Established 2026-05-15

---

## Scope

All libraries listed here are installed in the root Pain System repo (`jamainefacey-blip/Jamaine-Facey`).
They are available to: **VST** (Voyage Smart Travels) and all future Pain System frontend builds.
Lane: `VST` | `AI_LAB` (UI layer only)

---

## Installed Libraries

### 1. Framer Motion

| Field | Value |
|-------|-------|
| Package | `framer-motion` |
| Version | ^12.38.0 |
| Install | `npm install framer-motion` |
| Purpose | Component animations, page transitions, gesture-driven UI, layout animations |
| Use cases | Card reveals, modal transitions, drag interactions, scroll-based animations |

**Import examples:**
```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Fade in on mount
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} />

// Animated presence (mount/unmount)
<AnimatePresence>
  {isOpen && <motion.div exit={{ opacity: 0 }} />}
</AnimatePresence>
```

---

### 2. Lucide React

| Field | Value |
|-------|-------|
| Package | `lucide-react` |
| Version | ^1.16.0 |
| Install | `npm install lucide-react` |
| Purpose | Icon library — consistent, accessible SVG icons |
| Use cases | Navigation icons, action buttons, status indicators, feature callouts |

**Import examples:**
```tsx
import { Plane, Shield, BarChart2, MapPin, Search, ChevronRight } from 'lucide-react';

<Plane size={20} color="currentColor" />
<Shield className="icon-shield" strokeWidth={1.5} />
```

---

### 3. Radix UI Primitives

| Field | Value |
|-------|-------|
| Packages | `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip` |
| Versions | dialog ^1.1.15, dropdown-menu ^2.1.16, tooltip ^1.2.8 |
| Install | `npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tooltip` |
| Purpose | Accessible, unstyled UI primitives — bring your own styles |
| Use cases | Modals, dropdowns, tooltips — WCAG-compliant without wrestling with native elements |

**Import examples:**
```tsx
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';

// Modal
<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Trigger asChild><button>Open</button></Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="dialog-overlay" />
    <Dialog.Content className="dialog-content">...</Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

---

### 4. Tailwind CSS Plugins

| Field | Value |
|-------|-------|
| Packages | `@tailwindcss/typography`, `@tailwindcss/forms` |
| Versions | typography ^0.5.19, forms ^0.5.11 |
| Install | `npm install @tailwindcss/typography @tailwindcss/forms` |
| Purpose | Enhanced typography prose styles and normalised form element styles |
| Use cases | Blog/docs content areas (`.prose`), form inputs with consistent cross-browser baseline |
| Note | Requires Tailwind CSS setup in `tailwind.config.js` — not yet configured in this repo (CSS is hand-written). Add to plugins array when Tailwind is initialised. |

**Config example (when Tailwind is added):**
```js
// tailwind.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};
```

---

### 5. GSAP (GreenSock Animation Platform)

| Field | Value |
|-------|-------|
| Package | `gsap` |
| Version | ^3.15.0 |
| Install | `npm install gsap` |
| Purpose | Professional-grade animation engine — timeline, scroll-trigger, parallax |
| Use cases | Hero parallax, scroll-driven animations, complex sequenced transitions |

**Import examples:**
```tsx
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Parallax on scroll
gsap.to(element, {
  yPercent: 30,
  ease: 'none',
  scrollTrigger: { trigger: element, start: 'top top', end: 'bottom top', scrub: true },
});

// Dynamic import for SSR (Next.js)
import('gsap').then(({ gsap }) => {
  import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
    gsap.registerPlugin(ScrollTrigger);
    // animations here
  });
});
```

**Active usage:** `components/vst/HeroCarousel.tsx` — parallax scroll on hero bg and content layers

---

### 6. Swiper

| Field | Value |
|-------|-------|
| Package | `swiper` |
| Version | ^12.1.4 |
| Install | `npm install swiper` |
| Purpose | Premium touch-enabled carousel and slider |
| Use cases | Hero carousels, testimonial sliders, image galleries, content rotators |

**Import examples:**
```tsx
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';      // for crossfade
import 'swiper/css/pagination';       // for dots
import 'swiper/css/navigation';       // for arrows

<Swiper
  modules={[Autoplay, EffectFade, Pagination]}
  effect="fade"
  autoplay={{ delay: 5000, disableOnInteraction: false }}
  loop
  speed={1200}
  pagination={{ clickable: true, el: '.custom-dots' }}
>
  <SwiperSlide>Slide 1</SwiperSlide>
</Swiper>
```

**Active usage:** `components/vst/HeroCarousel.tsx` — full-screen hero with 8 destinations, 5s crossfade

---

### 7. AOS (Animate On Scroll)

| Field | Value |
|-------|-------|
| Package | `aos` |
| Version | ^2.3.4 |
| Install | `npm install aos` |
| Purpose | Declarative scroll-triggered reveal animations via data attributes |
| Use cases | Section reveals, card stagger animations, feature list entrances |

**Import examples:**
```tsx
import AOS from 'aos';
import 'aos/dist/aos.css';

// Initialise once in _app.tsx or useEffect
useEffect(() => {
  AOS.init({ duration: 600, once: true, offset: 80 });
}, []);

// Use in JSX via data attributes
<div data-aos="fade-up" data-aos-delay="100">Content</div>
<div data-aos="fade-up" data-aos-delay="200">Content</div>
```

---

### 8. Three.js

| Field | Value |
|-------|-------|
| Package | `three` |
| Version | ^0.184.0 |
| Install | `npm install three` |
| Purpose | 3D graphics and WebGL effects in the browser |
| Use cases | 3D hero elements, globe visualisations, particle effects, interactive 3D scenes |

**Import examples:**
```tsx
import * as THREE from 'three';

// Always use dynamic import in Next.js to avoid SSR errors
const THREE = await import('three');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
```

---

### 9. Lottie Web

| Field | Value |
|-------|-------|
| Package | `lottie-web` |
| Version | ^5.13.0 |
| Install | `npm install lottie-web` |
| Purpose | Render Adobe After Effects animations as lightweight JSON (Lottie format) |
| Use cases | Micro-animations, loading states, success/error states, icon animations |

**Import examples:**
```tsx
import lottie from 'lottie-web';

// Always use dynamic import for Next.js SSR safety
const lottie = (await import('lottie-web')).default;

lottie.loadAnimation({
  container: containerRef.current,
  renderer: 'svg',
  loop: true,
  autoplay: true,
  animationData: require('./animation.json'),
});
```

---

### 10. Typed.js

| Field | Value |
|-------|-------|
| Package | `typed.js` |
| Version | ^3.0.0 |
| Install | `npm install typed.js` |
| Purpose | Typewriter / typing animation effect |
| Use cases | Hero headlines cycling through values, AVA prompt suggestions, dynamic taglines |

**Import examples:**
```tsx
import Typed from 'typed.js';

// Always use dynamic import for Next.js SSR safety
useEffect(() => {
  let typed: Typed;
  import('typed.js').then(({ default: Typed }) => {
    typed = new Typed(spanRef.current, {
      strings: ['Santorini', 'Tokyo', 'New York', 'Bali'],
      typeSpeed: 60,
      backSpeed: 40,
      backDelay: 2000,
      loop: true,
    });
  });
  return () => typed?.destroy();
}, []);

// Target element
<span ref={spanRef} />
```

---

## SSR Safety Rules (Next.js)

These libraries interact with `window` or `document` and **must** be imported dynamically or guarded:

| Library | Safe pattern |
|---------|-------------|
| GSAP + ScrollTrigger | Dynamic import inside `useEffect` |
| Swiper | Use `dynamic(() => import(...), { ssr: false })` on the component |
| AOS | Call `AOS.init()` inside `useEffect` only |
| Three.js | Dynamic import inside `useEffect` |
| Lottie | Dynamic import inside `useEffect` |
| Typed.js | Dynamic import inside `useEffect` |
| Framer Motion | SSR-safe — import normally |
| Lucide React | SSR-safe — import normally |
| Radix UI | SSR-safe — import normally |

---

## Active Component Usage

| Component | Libraries used |
|-----------|---------------|
| `components/vst/HeroCarousel.tsx` | Swiper (carousel, autoplay, fade, pagination), GSAP ScrollTrigger (parallax) |

---

## Future Build Reference

When starting any Pain System UI build:

1. Check this registry for what's available before installing anything new
2. Use the import examples above verbatim — they are tested patterns
3. For new libraries, append an entry to this file in the same format
4. For any library touching `window`/`document`: follow SSR Safety Rules above
5. Do not import Swiper, Three.js, Lottie, Typed.js, or AOS at module level in Next.js pages/components

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| `1.0.0` | 2026-05-15 | Initial registry — 10 libraries installed, HeroCarousel built |
