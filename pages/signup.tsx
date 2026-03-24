import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/vst/Layout';

export default function Signup() {
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Auth integration point — connect Clerk or equivalent here
    setTimeout(() => setLoading(false), 600);
  }

  return (
    <Layout title="Start Free" description="Start your free Voyage Smart Travels account. No credit card required.">
      <div className="vst-auth">
        <div className="vst-auth__card">
          <div className="vst-auth__logo">
            <div style={{
              width: 40, height: 40,
              background: 'var(--vst-navy)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 18,
              margin: '0 auto',
            }}>V</div>
          </div>
          <div className="vst-auth__title">Start for free</div>
          <div className="vst-auth__sub">No credit card required. Up to 5 travellers on the free plan.</div>

          <button
            type="button"
            className="vst-btn vst-btn--secondary vst-btn--full"
            style={{ gap: 10, marginBottom: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          <div className="vst-auth__divider">or sign up with email</div>

          <form className="vst-form" onSubmit={handleSubmit}>
            <div className="vst-form-row">
              <div className="vst-field">
                <label className="vst-label-text" htmlFor="su-fname">First name</label>
                <input id="su-fname" className="vst-input" type="text" placeholder="Jane" required autoComplete="given-name" />
              </div>
              <div className="vst-field">
                <label className="vst-label-text" htmlFor="su-lname">Last name</label>
                <input id="su-lname" className="vst-input" type="text" placeholder="Smith" required autoComplete="family-name" />
              </div>
            </div>
            <div className="vst-field">
              <label className="vst-label-text" htmlFor="su-email">Work email</label>
              <input
                id="su-email"
                className="vst-input"
                type="email"
                placeholder="you@company.co.uk"
                required
                autoComplete="email"
              />
            </div>
            <div className="vst-field">
              <label className="vst-label-text" htmlFor="su-org">Organisation name</label>
              <input id="su-org" className="vst-input" type="text" placeholder="Acme Ltd" required autoComplete="organization" />
            </div>
            <div className="vst-field">
              <label className="vst-label-text" htmlFor="su-password">Password</label>
              <input
                id="su-password"
                className="vst-input"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <button
              type="submit"
              className="vst-btn vst-btn--primary vst-btn--full"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? 'Creating account…' : 'Create Free Account'}
            </button>
            <p style={{ fontSize: 12, color: 'var(--vst-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              By creating an account you agree to our{' '}
              <Link href="#" style={{ color: 'var(--vst-blue)' }}>Terms of Service</Link>{' '}
              and{' '}
              <Link href="#" style={{ color: 'var(--vst-blue)' }}>Privacy Policy</Link>.
            </p>
          </form>

          <div className="vst-auth__switch">
            Already have an account?{' '}
            <Link href="/login">Log in</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
