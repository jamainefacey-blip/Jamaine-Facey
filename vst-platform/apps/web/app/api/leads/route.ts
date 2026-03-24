import { NextRequest, NextResponse } from 'next/server';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const LEADS_FILE = join(DATA_DIR, 'leads.ndjson');

function persist(entry: Record<string, unknown>) {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    appendFileSync(LEADS_FILE, JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // Non-fatal: log to stdout if filesystem unavailable (edge/serverless)
    console.log('[VST_LEAD]', JSON.stringify(entry));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name = '', email = '', company = '', source = 'unknown', tier, message } = body as {
      name: string;
      email: string;
      company: string;
      source: string;
      tier?: string;
      message?: string;
    };

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
    }

    const lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company.trim(),
      source,
      tier: tier ?? null,
      message: message ?? null,
      capturedAt: new Date().toISOString(),
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    };

    persist(lead);

    return NextResponse.json(
      { success: true, message: 'Thank you. A member of our team will be in touch shortly.', id: lead.id },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Lead capture endpoint active.' });
}
