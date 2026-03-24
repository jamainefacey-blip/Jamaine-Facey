import { useState } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '/how-it-works',   label: 'How It Works' },
  { href: '/business-travel', label: 'Business Travel' },
  { href: '/pricing',        label: 'Pricing' },
  { href: '/compliance',     label: 'Compliance' },
  { href: '/demo',           label: 'Book Demo' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="vst-nav">
      <div className="vst-container">
        <div className="vst-nav__inner">
          <Link href="/" className="vst-nav__logo" onClick={() => setOpen(false)}>
            <span className="vst-nav__logo-mark">V</span>
            Voyage Smart Travels
          </Link>

          <ul className="vst-nav__links">
            {NAV_LINKS.map(l => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>

          <div className="vst-nav__actions">
            <Link href="/login" className="vst-nav__login">Log in</Link>
            <Link href="/signup" className="vst-btn vst-btn--primary vst-btn--sm">
              Start Free
            </Link>
            <button
              className="vst-nav__hamburger"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen(o => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </div>

      <div className={`vst-nav__mobile ${open ? 'open' : ''}`} aria-hidden={!open}>
        {NAV_LINKS.map(l => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
        <div style={{ paddingTop: 16 }}>
          <Link href="/signup" className="vst-btn vst-btn--primary vst-btn--full" onClick={() => setOpen(false)}>
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  );
}
