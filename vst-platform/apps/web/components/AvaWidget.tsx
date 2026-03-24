'use client';

import { useState, useRef, FormEvent } from 'react';

interface AvaResponse {
  destination: string;
  estimatedCost: number;
  currency: string;
  nights: number;
  riskLevel: 'low' | 'medium' | 'high';
  compliant: boolean;
  complianceNote: string;
  alternatives: string[];
  evaluatedAt: string;
  error?: string;
}

const RISK_COLOUR = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
};

const RISK_LABEL = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
};

export default function AvaWidget() {
  const [query, setQuery] = useState('');
  const [nights, setNights] = useState(3);
  const [result, setResult] = useState<AvaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/ava', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), nights }),
      });

      const data: AvaResponse = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Evaluation failed. Please try again.');
        return;
      }

      setResult(data);
    } catch {
      setError('Unable to reach evaluation service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError('');
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div className="w-full">
      {!result ? (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. London, 4 nights for client meeting"
            className="flex-1 bg-[#0B1120] border border-[#2C3E60] rounded px-4 py-2.5 text-sm text-white placeholder-[#8A99B8] focus:outline-none focus:border-[#1D6FF2] transition-colors"
            disabled={loading}
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#8A99B8] whitespace-nowrap">Nights</label>
            <input
              type="number"
              min={1}
              max={30}
              value={nights}
              onChange={(e) => setNights(Number(e.target.value))}
              className="w-16 bg-[#0B1120] border border-[#2C3E60] rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#1D6FF2] transition-colors"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-[#1D6FF2] text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-[#1558c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {loading ? 'Evaluating…' : 'Evaluate trip'}
          </button>
        </form>
      ) : null}

      {error && (
        <p className="mt-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded px-4 py-2.5">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 bg-[#0B1120] border border-[#1E2D4A] rounded-lg p-6 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-medium">{result.destination}</p>
              <p className="text-[#8A99B8] text-xs mt-0.5">
                {result.nights} night{result.nights !== 1 ? 's' : ''} · Estimated{' '}
                <span className="text-white font-medium">
                  ${result.estimatedCost.toLocaleString()} {result.currency}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`text-xs font-medium ${RISK_COLOUR[result.riskLevel]}`}>
                {RISK_LABEL[result.riskLevel]}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  result.compliant
                    ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                    : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                }`}
              >
                {result.compliant ? 'Compliant' : 'Approval required'}
              </span>
            </div>
          </div>

          {/* Compliance note */}
          <p className="text-sm text-[#8A99B8] border-t border-[#1E2D4A] pt-4">
            {result.complianceNote}
          </p>

          {/* Alternatives */}
          {result.alternatives.length > 0 && (
            <div className="border-t border-[#1E2D4A] pt-4">
              <p className="text-xs text-[#8A99B8] uppercase tracking-widest mb-2">
                Alternatives considered
              </p>
              <div className="flex flex-wrap gap-2">
                {result.alternatives.map((alt) => (
                  <span
                    key={alt}
                    className="text-xs bg-[#1A2540] border border-[#1E2D4A] text-slate-300 px-3 py-1 rounded-full"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-[#1E2D4A] pt-4 flex gap-3">
            {result.compliant ? (
              <a
                href="/sign-up"
                className="bg-[#1D6FF2] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#1558c4] transition-colors"
              >
                Proceed to booking
              </a>
            ) : (
              <a
                href="/sign-up"
                className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded text-sm font-medium hover:bg-amber-500/20 transition-colors"
              >
                Request approval
              </a>
            )}
            <button
              onClick={reset}
              className="border border-[#1E2D4A] text-[#8A99B8] px-4 py-2 rounded text-sm hover:border-[#2C3E60] hover:text-white transition-colors"
            >
              New evaluation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
