import { NextRequest, NextResponse } from 'next/server';

// ── Risk catalogue ────────────────────────────────────────────────────────────
const HIGH_RISK = ['kabul', 'mogadishu', 'tripoli', 'khartoum', 'damascus', 'kyiv', 'kharkiv', 'juba', 'sanaa', 'bamako'];
const MEDIUM_RISK = ['nairobi', 'lagos', 'karachi', 'dhaka', 'cairo', 'beirut', 'islamabad', 'jakarta', 'bogota', 'lima'];

// ── Cost catalogue (USD per night, approx) ───────────────────────────────────
const COST_MAP: Record<string, number> = {
  london: 280, paris: 260, new_york: 320, dubai: 240, singapore: 220,
  tokyo: 200, sydney: 230, toronto: 210, berlin: 180, amsterdam: 230,
  hong_kong: 250, zurich: 350, geneva: 370, stockholm: 200, oslo: 240,
};
const DEFAULT_COST = 180;

// ── Destination options ───────────────────────────────────────────────────────
const NEARBY: Record<string, string[]> = {
  london: ['Manchester', 'Edinburgh', 'Brussels'],
  paris: ['Lyon', 'Amsterdam', 'Geneva'],
  new_york: ['Boston', 'Washington D.C.', 'Philadelphia'],
  dubai: ['Abu Dhabi', 'Doha', 'Riyadh'],
  singapore: ['Kuala Lumpur', 'Bangkok', 'Jakarta'],
};

// ── Policy spend limit (per trip, USD) ───────────────────────────────────────
const POLICY_LIMIT = 3500;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function resolveRisk(dest: string): 'low' | 'medium' | 'high' {
  const key = slugify(dest);
  if (HIGH_RISK.some((d) => key.includes(d))) return 'high';
  if (MEDIUM_RISK.some((d) => key.includes(d))) return 'medium';
  return 'low';
}

function estimateCost(dest: string, nights: number): number {
  const key = slugify(dest);
  const nightly = Object.entries(COST_MAP).find(([city]) => key.includes(city))?.[1] ?? DEFAULT_COST;
  return nightly * nights + 650; // flights flat rate
}

function resolveOptions(dest: string): string[] {
  const key = slugify(dest);
  const match = Object.entries(NEARBY).find(([city]) => key.includes(city));
  return match ? match[1] : ['Virtual alternative available', 'Nearest hub city'];
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query = '', nights = 3, purpose = 'business' } = body as {
      query: string;
      nights: number;
      purpose: string;
    };

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Travel request is required.' }, { status: 400 });
    }

    const destination = query.trim();
    const risk = resolveRisk(destination);
    const estimatedCost = estimateCost(destination, nights);
    const compliant = estimatedCost <= POLICY_LIMIT && risk !== 'high';
    const options = resolveOptions(destination);

    const response = {
      destination,
      estimatedCost,
      currency: 'USD',
      nights,
      purpose,
      riskLevel: risk,
      compliant,
      complianceNote: !compliant
        ? risk === 'high'
          ? 'Destination flagged as high risk. Approval required from Security and Senior Management.'
          : `Estimated cost exceeds policy limit of $${POLICY_LIMIT.toLocaleString()}. Finance approval required.`
        : 'This trip is within policy. Proceed to booking.',
      alternatives: options,
      evaluatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to evaluate travel request.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Ava evaluation endpoint active.' });
}
