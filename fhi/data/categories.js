/**
 * Fraud Help Index — Category Taxonomy
 * 8 primary fraud categories with metadata for UI rendering,
 * filtering, and report classification.
 */

export const CATEGORIES = [
  {
    id: "phishing",
    label: "Phishing / Email Scam",
    icon: "🎣",
    color: "#e74c3c",
    description: "Fake emails, texts, or websites designed to steal login credentials, personal data, or payment details.",
    examples: ["Fake bank email", "SMS with suspicious link", "Clone website login page"],
    severity_default: "high",
  },
  {
    id: "romance",
    label: "Romance Scam",
    icon: "💔",
    color: "#e91e8f",
    description: "Fraudster builds a fake romantic relationship to manipulate victim into sending money or personal information.",
    examples: ["Dating app catfish", "Long-distance money requests", "Military impersonation romance"],
    severity_default: "high",
  },
  {
    id: "investment",
    label: "Investment / Crypto Fraud",
    icon: "📉",
    color: "#f39c12",
    description: "Fake investment platforms, Ponzi schemes, pump-and-dump crypto tokens, or fraudulent trading signals.",
    examples: ["Fake trading platform", "Guaranteed returns promise", "Crypto rug pull", "Forex signal scam"],
    severity_default: "critical",
  },
  {
    id: "identity_theft",
    label: "Identity Theft",
    icon: "🪪",
    color: "#8e44ad",
    description: "Unauthorised use of personal information to open accounts, make purchases, or commit crimes in the victim's name.",
    examples: ["Credit card opened in your name", "Tax return filed fraudulently", "Medical identity theft"],
    severity_default: "critical",
  },
  {
    id: "tech_support",
    label: "Tech Support Scam",
    icon: "🖥️",
    color: "#3498db",
    description: "Fake tech support calls or pop-ups claiming your device is infected, then charging for unnecessary 'repairs'.",
    examples: ["Microsoft support pop-up", "Remote access request", "Fake antivirus subscription"],
    severity_default: "medium",
  },
  {
    id: "marketplace",
    label: "Marketplace / Shopping Fraud",
    icon: "🛒",
    color: "#27ae60",
    description: "Fake online stores, non-delivery of goods, counterfeit products, or payment fraud on buying/selling platforms.",
    examples: ["Paid but item never shipped", "Counterfeit branded goods", "Fake online store"],
    severity_default: "medium",
  },
  {
    id: "government_impersonation",
    label: "Government Impersonation",
    icon: "🏛️",
    color: "#2c3e50",
    description: "Scammers posing as tax authorities, law enforcement, or government agencies to demand payment or personal data.",
    examples: ["IRS/HMRC phone threat", "Fake court summons email", "Immigration scam call"],
    severity_default: "high",
  },
  {
    id: "other",
    label: "Other / Uncategorised",
    icon: "⚠️",
    color: "#7f8c8d",
    description: "Fraud that doesn't fit neatly into the above categories. Moderators may reclassify after review.",
    examples: ["Charity scam", "Lottery/prize scam", "Employment scam", "Rental fraud"],
    severity_default: "medium",
  },
];

export const SEVERITY_LEVELS = [
  { id: "low",      label: "Low",      color: "#27ae60", description: "Minor financial risk or nuisance" },
  { id: "medium",   label: "Medium",   color: "#f39c12", description: "Moderate financial or personal risk" },
  { id: "high",     label: "High",     color: "#e74c3c", description: "Significant financial loss or data exposure" },
  { id: "critical", label: "Critical", color: "#8e44ad", description: "Severe loss, identity compromise, or ongoing threat" },
];

export const REPORT_STATUSES = [
  {
    id: "submitted",
    label: "Submitted",
    color: "#3498db",
    description: "Report received, awaiting review",
    explanation: "This report has been submitted and is waiting for a moderator to begin review.",
    actionLabel: "Begin Review",
  },
  {
    id: "under_review",
    label: "Under Review",
    color: "#f39c12",
    description: "Moderator is reviewing this report",
    explanation: "A moderator is currently reviewing this report for accuracy and evidence quality.",
    actionLabel: "Mark Under Review",
  },
  {
    id: "confirmed",
    label: "Confirmed",
    color: "#e74c3c",
    description: "Fraud confirmed by moderator or community",
    explanation: "This fraud case has been verified by a moderator or corroborated by multiple community members.",
    actionLabel: "Confirm Fraud",
  },
  {
    id: "resolved",
    label: "Resolved",
    color: "#27ae60",
    description: "Case resolved or action taken",
    explanation: "This case has been resolved. Appropriate action has been taken or the threat has been mitigated.",
    actionLabel: "Mark Resolved",
  },
  {
    id: "disputed",
    label: "Disputed",
    color: "#e67e22",
    description: "Report accuracy challenged — under re-review",
    explanation: "This report has been challenged by the community or a moderator. It is under additional review.",
    actionLabel: "Mark Disputed",
  },
  {
    id: "rejected",
    label: "Rejected",
    color: "#95a5a6",
    description: "Report rejected — insufficient evidence or false report",
    explanation: "This report was reviewed and rejected due to insufficient evidence, duplicate content, or being a false report.",
    actionLabel: "Reject Report",
  },
  {
    id: "archived",
    label: "Archived",
    color: "#636e72",
    description: "Report archived — no longer active",
    explanation: "This report has been archived. It remains on record but is no longer actively monitored.",
    actionLabel: "Archive",
  },
];

/** Financial harm thresholds for filtering */
export const HARM_TIERS = [
  { id: "none",     label: "No loss",       min: 0,     max: 0     },
  { id: "low",      label: "Under £500",    min: 1,     max: 499   },
  { id: "medium",   label: "£500 – £5,000", min: 500,   max: 5000  },
  { id: "high",     label: "£5,000+",       min: 5001,  max: Infinity },
];

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

export function getSeverityById(id) {
  return SEVERITY_LEVELS.find(s => s.id === id) || SEVERITY_LEVELS[1];
}

export function getStatusById(id) {
  return REPORT_STATUSES.find(s => s.id === id) || REPORT_STATUSES[0];
}
