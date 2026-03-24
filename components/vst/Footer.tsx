import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="vst-footer">
      <div className="vst-container">
        <div className="vst-footer__grid">
          <div>
            <div className="vst-footer__brand">Voyage Smart Travels</div>
            <p className="vst-footer__tagline">
              AI-powered business travel management for UK SMEs and public sector organisations.
              Smarter booking, built-in compliance, full visibility.
            </p>
          </div>
          <div className="vst-footer__col">
            <div className="vst-footer__col-title">Product</div>
            <ul>
              <li><Link href="/how-it-works">How It Works</Link></li>
              <li><Link href="/business-travel">Business Travel</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/compliance">Compliance</Link></li>
            </ul>
          </div>
          <div className="vst-footer__col">
            <div className="vst-footer__col-title">Company</div>
            <ul>
              <li><Link href="/demo">Book a Demo</Link></li>
              <li><Link href="/signup">Start Free</Link></li>
              <li><Link href="/login">Log In</Link></li>
            </ul>
          </div>
          <div className="vst-footer__col">
            <div className="vst-footer__col-title">Legal</div>
            <ul>
              <li><Link href="#">Privacy Policy</Link></li>
              <li><Link href="#">Terms of Service</Link></li>
              <li><Link href="#">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="vst-footer__bottom">
          <span>© {new Date().getFullYear()} Voyage Smart Travels Ltd. All rights reserved.</span>
          <span>Built for UK business travel</span>
        </div>
      </div>
    </footer>
  );
}
