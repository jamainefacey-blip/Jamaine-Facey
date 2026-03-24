'use client';

import { useState, FormEvent } from 'react';

export default function SignUpPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', tier: 'starter' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'signup' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Submission failed. Please try again.');
      } else {
        setStatus('success');
        setMessage(data.message);
      }
    } catch {
      setStatus('error');
      setMessage('Unable to submit. Please check your connection and try again.');
    }
  }

  return (
    <main className="min-h-screen bg-[#0B1120] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <a href="/" className="text-[#1D6FF2] font-bold text-xl tracking-tight mb-10 block">
          VST
        </a>

        {status === 'success' ? (
          <div className="bg-[#1A2540] border border-[#1E2D4A] rounded-xl p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-emerald-400 text-lg">&#10003;</span>
            </div>
            <h2 className="text-white font-semibold text-lg mb-2">Request received</h2>
            <p className="text-[#8A99B8] text-sm">{message}</p>
            <a
              href="/"
              className="mt-6 inline-block text-sm text-[#1D6FF2] hover:underline"
            >
              Return to homepage
            </a>
          </div>
        ) : (
          <div className="bg-[#1A2540] border border-[#1E2D4A] rounded-xl p-8">
            <h1 className="text-white font-semibold text-2xl mb-1">Get started</h1>
            <p className="text-[#8A99B8] text-sm mb-8">
              Register your organisation for Voyage Smart Travels.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-[#8A99B8] mb-1.5 uppercase tracking-widest">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#2C3E60] rounded px-4 py-2.5 text-sm text-white placeholder-[#8A99B8] focus:outline-none focus:border-[#1D6FF2] transition-colors"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8A99B8] mb-1.5 uppercase tracking-widest">
                  Work email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#2C3E60] rounded px-4 py-2.5 text-sm text-white placeholder-[#8A99B8] focus:outline-none focus:border-[#1D6FF2] transition-colors"
                  placeholder="jane@company.com"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8A99B8] mb-1.5 uppercase tracking-widest">
                  Company
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => update('company', e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#2C3E60] rounded px-4 py-2.5 text-sm text-white placeholder-[#8A99B8] focus:outline-none focus:border-[#1D6FF2] transition-colors"
                  placeholder="Acme Ltd"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8A99B8] mb-1.5 uppercase tracking-widest">
                  Control level
                </label>
                <select
                  value={form.tier}
                  onChange={(e) => update('tier', e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#2C3E60] rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#1D6FF2] transition-colors"
                >
                  <option value="starter">Starter — Basic control (Free)</option>
                  <option value="business">Business — Full operational control ($19/user)</option>
                  <option value="enterprise">Enterprise — Complete organisational oversight</option>
                </select>
              </div>

              {status === 'error' && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded px-4 py-2.5">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-[#1D6FF2] text-white py-2.5 rounded text-sm font-medium hover:bg-[#1558c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
              >
                {status === 'loading' ? 'Submitting…' : 'Request access'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[#8A99B8]">
              Already registered?{' '}
              <a href="/sign-in" className="text-[#1D6FF2] hover:underline">
                Sign in
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
