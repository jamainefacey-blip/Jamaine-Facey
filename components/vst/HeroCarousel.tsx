import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

const DESTINATIONS = [
  {
    name: 'Santorini',
    country: 'Greece',
    gradient: 'linear-gradient(160deg, #f97316 0%, #ec4899 40%, #7c3aed 100%)',
    overlay: 'rgba(15,10,30,0.52)',
  },
  {
    name: 'Bali',
    country: 'Indonesia',
    gradient: 'linear-gradient(160deg, #065f46 0%, #0d9488 50%, #164e63 100%)',
    overlay: 'rgba(4,30,20,0.50)',
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    gradient: 'linear-gradient(160deg, #1e1b4b 0%, #6d28d9 50%, #ec4899 100%)',
    overlay: 'rgba(10,5,40,0.55)',
  },
  {
    name: 'Marrakech',
    country: 'Morocco',
    gradient: 'linear-gradient(160deg, #92400e 0%, #d97706 45%, #b45309 100%)',
    overlay: 'rgba(40,15,0,0.52)',
  },
  {
    name: 'Iceland',
    country: 'Iceland',
    gradient: 'linear-gradient(160deg, #1e3a5f 0%, #0ea5e9 45%, #34d399 100%)',
    overlay: 'rgba(5,20,40,0.54)',
  },
  {
    name: 'Patagonia',
    country: 'Argentina',
    gradient: 'linear-gradient(160deg, #0f766e 0%, #1e40af 50%, #374151 100%)',
    overlay: 'rgba(5,20,30,0.52)',
  },
  {
    name: 'Maldives',
    country: 'Maldives',
    gradient: 'linear-gradient(160deg, #0369a1 0%, #06b6d4 40%, #34d399 100%)',
    overlay: 'rgba(0,20,40,0.45)',
  },
  {
    name: 'New York',
    country: 'USA',
    gradient: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #334155 100%)',
    overlay: 'rgba(5,10,25,0.58)',
  },
];

export default function HeroCarousel() {
  const parallaxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let gsapInstance: typeof import('gsap').gsap | null = null;
    let ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger | null = null;

    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger: ST }) => {
        gsap.registerPlugin(ST);
        gsapInstance = gsap;
        ScrollTrigger = ST;

        if (parallaxRef.current) {
          gsap.to(parallaxRef.current, {
            yPercent: 30,
            ease: 'none',
            scrollTrigger: {
              trigger: parallaxRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });
        }

        if (contentRef.current) {
          gsap.to(contentRef.current, {
            yPercent: 15,
            opacity: 0.4,
            ease: 'none',
            scrollTrigger: {
              trigger: contentRef.current,
              start: 'top top',
              end: '60% top',
              scrub: true,
            },
          });
        }
      });
    });

    return () => {
      ScrollTrigger?.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section className="vst-hero-carousel">
      {/* Swiper background */}
      <div className="vst-hero-carousel__bg" ref={parallaxRef}>
        <Swiper
          modules={[Autoplay, EffectFade, Pagination]}
          effect="fade"
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          speed={1200}
          pagination={{ clickable: true, el: '.vst-hero-carousel__dots' }}
          className="vst-hero-carousel__swiper"
        >
          {DESTINATIONS.map((dest) => (
            <SwiperSlide key={dest.name}>
              <div
                className="vst-hero-carousel__slide"
                style={{ background: dest.gradient }}
              >
                <div
                  className="vst-hero-carousel__slide-overlay"
                  style={{ background: dest.overlay }}
                />
                <div className="vst-hero-carousel__location">
                  <span className="vst-hero-carousel__location-name">{dest.name}</span>
                  <span className="vst-hero-carousel__location-country">{dest.country}</span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Fixed content overlay */}
      <div className="vst-hero-carousel__content" ref={contentRef}>
        <div className="vst-container">
          <div className="vst-hero-carousel__inner">
            <div className="vst-hero-carousel__badge">
              ✦ Meet Ava — your AI travel assistant
            </div>
            <h1 className="vst-hero-carousel__title">
              Business travel,{' '}
              <em>managed properly</em>
            </h1>
            <p className="vst-hero-carousel__sub">
              Voyage Smart Travels gives UK SMEs and public sector teams a smarter way to book,
              manage, and report on business travel.
            </p>

            {/* AVA search bar */}
            <div className="vst-hero-carousel__search">
              <div className="vst-hero-carousel__search-icon">✦</div>
              <input
                type="text"
                className="vst-hero-carousel__search-input"
                placeholder="Ask Ava — where are you travelling to?"
                aria-label="Ask Ava"
              />
              <button className="vst-hero-carousel__search-btn" type="button">
                Search
              </button>
            </div>

            <div className="vst-hero-carousel__ctas">
              <Link href="/signup" className="vst-btn vst-btn--primary vst-btn--lg">
                Start Free
              </Link>
              <Link href="/demo" className="vst-btn vst-btn--ghost-light vst-btn--lg">
                Book a Demo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination dots */}
      <div className="vst-hero-carousel__dots" />
    </section>
  );
}
