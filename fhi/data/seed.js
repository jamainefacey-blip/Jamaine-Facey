/**
 * Fraud Help Index — Seed / Demo Data
 * 8 realistic demo reports (one per category) for testing all views.
 */

import { createReport } from "./schema.js";

export const SEED_REPORTS = [
  createReport({
    category: "phishing",
    title: "Fake HSBC email requesting account verification",
    description: "Received an email claiming to be from HSBC saying my account was locked and I needed to verify my identity via a link. The link went to a cloned HSBC login page at hsbc-secure-verify.com. I entered my details before realising it was fake. Changed my password immediately.",
    severity: "high",
    evidenceLinks: ["https://example.com/screenshot-fake-hsbc-email.png"],
    contactMethod: "Email",
    scammerIdentifiers: ["security@hsbc-alerts-verify.com", "hsbc-secure-verify.com"],
    incidentDate: "2026-03-10",
    amountLost: 0,
    currency: "GBP",
  }),
  createReport({
    category: "romance",
    title: "Dating app match asked for £2,000 for emergency flight",
    description: "Met someone on Hinge who claimed to be a British engineer working in Dubai. After 3 weeks of daily messaging and video calls (which were always 'broken'), they asked me to send £2,000 via bank transfer for an emergency flight home. When I refused, they became aggressive then disappeared. Profile was deleted.",
    severity: "high",
    evidenceLinks: [],
    contactMethod: "Hinge dating app",
    scammerIdentifiers: ["Hinge profile: James_Engineer_Dubai"],
    incidentDate: "2026-02-28",
    amountLost: 0,
    currency: "GBP",
  }),
  createReport({
    category: "investment",
    title: "Fake crypto trading platform stole £15,000 deposit",
    description: "Was invited to join QuantumTradeAI platform via Instagram DM. The website looked professional with live charts. I deposited £5,000 initially and the dashboard showed huge profits. Deposited another £10,000. When I tried to withdraw, they demanded a 20% 'tax fee' and then the site went offline.",
    severity: "critical",
    evidenceLinks: ["https://example.com/quantumtradeai-screenshot.png", "https://example.com/instagram-dm-invite.png"],
    contactMethod: "Instagram DM",
    scammerIdentifiers: ["quantumtradeai.io", "@crypto_wealth_signals (Instagram)"],
    incidentDate: "2026-01-15",
    amountLost: 15000,
    currency: "GBP",
  }),
  createReport({
    category: "identity_theft",
    title: "Credit card opened in my name — discovered via credit report",
    description: "Checked my Experian report and found a Barclaycard account I never opened, with £3,200 in charges. Filed a police report and contacted Barclays fraud team. They confirmed the application used my name, date of birth, and a previous address. Suspect my data was leaked in a breach.",
    severity: "critical",
    evidenceLinks: [],
    contactMethod: "Unknown — data breach suspected",
    scammerIdentifiers: [],
    incidentDate: "2026-03-01",
    amountLost: 3200,
    currency: "GBP",
  }),
  createReport({
    category: "tech_support",
    title: "Pop-up claimed virus detected — charged £299 for fake cleanup",
    description: "A browser pop-up appeared saying 'Windows Defender has detected a critical threat' with a phone number to call. The 'technician' asked me to install AnyDesk for remote access, ran some fake scans, then charged £299 to 'remove the virus'. They had full access to my PC for about 30 minutes.",
    severity: "high",
    evidenceLinks: ["https://example.com/fake-windows-popup.png"],
    contactMethod: "Phone call after browser pop-up",
    scammerIdentifiers: ["0800-555-0199", "support@windowsdefenderhelp.net"],
    incidentDate: "2026-03-05",
    amountLost: 299,
    currency: "GBP",
  }),
  createReport({
    category: "marketplace",
    title: "Paid £450 for PS5 on Facebook Marketplace — never delivered",
    description: "Found a PS5 listed on Facebook Marketplace for £450. Seller had a seemingly legitimate profile with history. Paid via bank transfer as they claimed PayPal was not working. After payment, they sent a fake Royal Mail tracking number. Number was invalid. Seller blocked me on all platforms.",
    severity: "medium",
    evidenceLinks: [],
    contactMethod: "Facebook Marketplace",
    scammerIdentifiers: ["Facebook: Dave's Gaming Deals"],
    incidentDate: "2026-02-20",
    amountLost: 450,
    currency: "GBP",
  }),
  createReport({
    category: "government_impersonation",
    title: "HMRC phone call threatening arrest for unpaid taxes",
    description: "Received an automated call claiming to be from HMRC saying I owed £4,500 in unpaid taxes and a warrant had been issued for my arrest. The call instructed me to press 1 to speak to an officer. The 'officer' asked for my National Insurance number and demanded immediate payment via gift cards.",
    severity: "high",
    evidenceLinks: [],
    contactMethod: "Phone call (automated + live person)",
    scammerIdentifiers: ["+44 7911 123456"],
    incidentDate: "2026-03-12",
    amountLost: 0,
    currency: "GBP",
  }),
  createReport({
    category: "other",
    title: "Fake charity collection for earthquake relief at my door",
    description: "Two people knocked on my door claiming to collect for Turkey earthquake relief. They had printed ID badges and a collection tin but the charity name 'Global Aid Direct' does not appear on the Charity Commission register. I did not donate but my elderly neighbour gave them £50 in cash.",
    severity: "medium",
    evidenceLinks: [],
    contactMethod: "Door-to-door",
    scammerIdentifiers: ["Global Aid Direct (unregistered charity)"],
    incidentDate: "2026-03-14",
    amountLost: 0,
    currency: "GBP",
  }),
];

/**
 * Loads seed data into localStorage if the store is empty.
 */
export function loadSeedDataIfEmpty(store) {
  const existing = store.getAllReports();
  if (existing.length === 0) {
    for (const report of SEED_REPORTS) {
      store.saveReport(report);
    }
    return true;
  }
  return false;
}
