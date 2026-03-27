/**
 * defence.ts — PC-DEFENCE-01
 * Protects Pain Control from unsafe inputs and data leakage.
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Types ──────────────────────────────────────────────────────────────────

export type DataClassification = 'public' | 'internal' | 'sensitive' | 'secret';
export type DefenceVerdict     = 'CLEAN' | 'SUSPICIOUS' | 'BLOCKED';

export interface DefenceResult {
  verdict:        DefenceVerdict;
  classification: DataClassification;
  findings:       string[];
  redacted:       boolean;
  inputHash:      string;  // hash only — never the raw input
}

// ── Secret / credential patterns ──────────────────────────────────────────

const SECRET_PATTERNS: RegExp[] = [
  /\b(password|passwd|pwd)\s*[:=]\s*\S+/i,
  /\bapi[_-]?key\s*[:=]\s*\S+/i,
  /\bsecret\s*[:=]\s*\S+/i,
  /\btoken\s*[:=]\s*\S+/i,
  /\bprivate[_-]?key\s*[:=]/i,
  /\bsk-[a-zA-Z0-9]{20,}/,          // OpenAI/Stripe style keys
  /\bghp_[a-zA-Z0-9]{30,}/,         // GitHub PAT
  /\bAIza[0-9A-Za-z_-]{35}/,        // Google API key
  /-----BEGIN (RSA |EC )?PRIVATE KEY/,
  /\b[a-f0-9]{40}\b/,               // SHA1 hash (potential token)
];

// ── Injection patterns ─────────────────────────────────────────────────────

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all )?(previous|prior|above) instructions?/i,
  /disregard (your )?(previous|prior|above|system)/i,
  /you are now/i,
  /act as (if you are|a )/i,
  /override (your )?(policy|rules?|guardrail|canon)/i,
  /bypass (the )?(guardrail|policy|restriction|rule)/i,
  /jailbreak/i,
  /do anything now/i,
  /DAN mode/i,
  /\[system\]/i,
  /<\|im_start\|>/i,
  /unlock FULL_AUTO/i,
  /set mode to FULL_AUTO/i,
];

// ── Override attempt patterns ──────────────────────────────────────────────

const OVERRIDE_PATTERNS: RegExp[] = [
  /override canon/i,
  /change the (law|rule|policy)/i,
  /disable (the )?(kill switch|guardrail|defence)/i,
  /grant (yourself|full|admin|founder) (access|permission|authority)/i,
  /promote (yourself|external_input|client) to founder/i,
];

// ── PII patterns ───────────────────────────────────────────────────────────

const PII_PATTERNS: RegExp[] = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,  // email
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,             // phone
  /\b\d{3}-\d{2}-\d{4}\b/,                          // SSN
  /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b/, // CC
];

// ── Simple hash (not crypto — for logging only) ────────────────────────────

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, '0');
}

// ── Classification ────────────────────────────────────────────────────────

function classifyInput(input: string): DataClassification {
  if (SECRET_PATTERNS.some(r => r.test(input))) return 'secret';
  if (PII_PATTERNS.some(r => r.test(input)))    return 'sensitive';
  if (/internal|private|confidential/i.test(input)) return 'internal';
  return 'public';
}

// ── Core check ────────────────────────────────────────────────────────────

export function inspect(input: string, source: 'external' | 'internal' | 'system' = 'external'): DefenceResult {
  const findings: string[] = [];
  let verdict: DefenceVerdict = 'CLEAN';
  let redacted = false;

  const classification = classifyInput(input);

  // Secrets — always block and redact
  if (classification === 'secret') {
    findings.push('SECRET/CREDENTIAL pattern detected — input redacted');
    verdict  = 'BLOCKED';
    redacted = true;
    logSecurityEvent('SECRET_DETECTED', 'Credential pattern found — not logged', classification);
    return { verdict, classification, findings, redacted, inputHash: simpleHash(input) };
  }

  // Injection attempts
  for (const rx of INJECTION_PATTERNS) {
    if (rx.test(input)) {
      findings.push(`INJECTION pattern matched: ${rx.source.slice(0, 40)}`);
      verdict = 'BLOCKED';
    }
  }

  // Override attempts
  for (const rx of OVERRIDE_PATTERNS) {
    if (rx.test(input)) {
      findings.push(`OVERRIDE attempt: ${rx.source.slice(0, 40)}`);
      verdict = 'BLOCKED';
    }
  }

  // PII in external input
  if (source === 'external' && classification === 'sensitive') {
    findings.push('PII detected in external input — flagged sensitive');
    if (verdict === 'CLEAN') verdict = 'SUSPICIOUS';
  }

  // External input cannot be clean if it contains governance keywords without being flagged
  if (source === 'external' && /canon|guardrail|policy|governance|founder/i.test(input) && verdict === 'CLEAN') {
    findings.push('External input references governance layer — treated as untrusted');
    verdict = 'SUSPICIOUS';
  }

  if (verdict !== 'CLEAN') {
    logSecurityEvent('SUSPICIOUS_PATTERN', findings.join('; '), classification);
  }

  return { verdict, classification, findings, redacted, inputHash: simpleHash(input) };
}

// ── Output filter ─────────────────────────────────────────────────────────

export function filterOutput(output: string): string {
  // Redact any secret patterns that may have leaked into output
  let filtered = output;
  for (const rx of SECRET_PATTERNS) {
    filtered = filtered.replace(rx, '[REDACTED]');
  }
  return filtered;
}

// ── Security logging ──────────────────────────────────────────────────────

const SECURITY_LOG = path.join('engine', 'data', 'security-log.json');

function logSecurityEvent(type: string, message: string, classification: DataClassification): void {
  try {
    const log = JSON.parse(fs.readFileSync(SECURITY_LOG, 'utf8'));
    log.entries.push({
      id:             `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      timestamp:      new Date().toISOString(),
      message,       // never contains raw secret content
      classification,
      lane:           'AI_LAB',
      redacted:       classification === 'secret',
    });
    // Rotate if over limit
    if (log.entries.length > (log.rotationPolicy?.maxEntries ?? 500)) {
      log.entries = log.entries.slice(-400);
    }
    fs.writeFileSync(SECURITY_LOG, JSON.stringify(log, null, 2), 'utf8');
  } catch { /* non-fatal — logging must not crash execution */ }
}
