import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/vst/Layout';

export default function Login() {
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Auth integration point — connect Clerk or equivalent here
    setTimeout(() => setLoading(false), 600);
  }

  return (
    <Layout title="Log In" description="Log in to your Voyage Smart Travels account.">
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
          <div className="vst-auth__title">Welcome back</div>
          <div className="vst-auth__sub">Log in to your VST account</div>

          <form className="vst-form" onSubmit={handleSubmit}>
            <div className="vst-field">
              <label className="vst-label-text" htmlFor="login-email">Work email</label>
              <input
                id="login-email"
                className="vst-input"
                type="email"
                placeholder="you@company.co.uk"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="vst-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="vst-label-text" htmlFor="login-password">Password</label>
                <Link href="#" style={{ fontSize: 13, color: 'var(--vst-blue)', fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                className="vst-input"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="vst-btn vst-btn--primary vst-btn--full"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="vst-auth__divider">or</div>

          <button
            type="button"
            className="vst-btn vst-btn--secondary vst-btn--full"
            style={{ gap: 10 }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="vst-auth__switch">
            Don't have an account?{' '}
            <Link href="/signup">Sign up free</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
