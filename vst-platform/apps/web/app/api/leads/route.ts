import { NextRequest, NextResponse } from 'next/server';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Resend } from 'resend';

const DATA_DIR = join(process.cwd(), 'data');
const LEADS_FILE = join(DATA_DIR, 'leads.ndjson');

const SOURCE_LABELS: Record<string, string> = {
  signup:  'New registration',
  signin:  'Sign-in request',
  demo:    'Demo booking',
  unknown: 'Inbound lead',
};

const TIER_LABELS: Record<string, string> = {
  starter:    'Starter — Basic control',
  business:   'Business — Full operational control',
  enterprise: 'Enterprise — Complete organisational oversight',
};

function persist(entry: Record<string, unknown>) {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    appendFileSync(LEADS_FILE, JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    console.log('[VST_LEAD]', JSON.stringify(entry));
  }
}

function buildNotificationHtml(lead: {
  id: string;
  name: string;
  email: string;
  company: string;
  source: string;
  tier: string | null;
  message: string | null;
  capturedAt: string;
}) {
  const sourceLabel = SOURCE_LABELS[lead.source] ?? lead.source;
  const tierLabel   = lead.tier ? (TIER_LABELS[lead.tier] ?? lead.tier) : '—';
  const rows = [
    ['Source',    sourceLabel],
    ['Name',      lead.name || '—'],
    ['Email',     lead.email],
    ['Company',   lead.company || '—'],
    ['Tier',      tierLabel],
    ['Message',   lead.message || '—'],
    ['Captured',  new Date(lead.capturedAt).toUTCString()],
    ['Lead ID',   lead.id],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:8px 12px;color:#8A99B8;font-size:13px;white-space:nowrap;border-bottom:1px solid #1E2D4A">${label}</td>
          <td style="padding:8px 12px;color:#E2E8F0;font-size:13px;border-bottom:1px solid #1E2D4A">${value}</td>
        </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0B1120;font-family:system-ui,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#111827;border:1px solid #1E2D4A;border-radius:12px;overflow:hidden">
    <div style="background:#1A2540;padding:24px 28px;border-bottom:1px solid #1E2D4A">
      <span style="color:#1D6FF2;font-weight:700;font-size:18px;letter-spacing:-0.5px">VST</span>
      <span style="color:#8A99B8;font-size:14px;margin-left:8px">Voyage Smart Travels</span>
    </div>
    <div style="padding:24px 28px">
      <h2 style="margin:0 0 4px;color:#fff;font-size:16px;font-weight:600">${sourceLabel}</h2>
      <p style="margin:0 0 20px;color:#8A99B8;font-size:13px">Submitted ${new Date(lead.capturedAt).toUTCString()}</p>
      <table style="width:100%;border-collapse:collapse;background:#0B1120;border-radius:8px;overflow:hidden">
        ${tableRows}
      </table>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #1E2D4A">
      <p style="margin:0;color:#8A99B8;font-size:11px">This notification was generated automatically by the VST lead capture system.</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendNotification(lead: {
  id: string;
  name: string;
  email: string;
  company: string;
  source: string;
  tier: string | null;
  message: string | null;
  capturedAt: string;
}): Promise<{ sent: boolean; note: string }> {
  const apiKey     = process.env.RESEND_API_KEY;
  const notifyTo   = process.env.VST_NOTIFY_EMAIL;
  const fromEmail  = process.env.VST_FROM_EMAIL ?? 'VST Leads <onboarding@resend.dev>';

  if (!apiKey) {
    return { sent: false, note: 'RESEND_API_KEY not configured.' };
  }
  if (!notifyTo) {
    return { sent: false, note: 'VST_NOTIFY_EMAIL not configured.' };
  }

  try {
    const resend = new Resend(apiKey);
    const sourceLabel = SOURCE_LABELS[lead.source] ?? lead.source;
    const { error } = await resend.emails.send({
      from:    fromEmail,
      to:      [notifyTo],
      subject: `[VST] ${sourceLabel} — ${lead.email}`,
      html:    buildNotificationHtml(lead),
    });

    if (error) {
      console.error('[VST_EMAIL_ERROR]', error);
      return { sent: false, note: error.message ?? 'Resend returned an error.' };
    }

    return { sent: true, note: `Notification sent to ${notifyTo}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[VST_EMAIL_ERROR]', msg);
    return { sent: false, note: msg };
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

    // Always persist — email is best-effort
    persist(lead);

    const { sent: emailSent, note: emailNote } = await sendNotification(lead);

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you. A member of our team will be in touch shortly.',
        id: lead.id,
        emailSent,
        emailNote,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Lead capture endpoint active.' });
}
