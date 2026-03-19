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
  { id: "submitted",    label: "Submitted",    color: "#3498db", description: "Report received, awaiting review" },
  { id: "under_review", label: "Under Review", color: "#f39c12", description: "Moderator is reviewing this report" },
  { id: "confirmed",    label: "Confirmed",    color: "#e74c3c", description: "Fraud confirmed by moderator or community" },
  { id: "resolved",     label: "Resolved",     color: "#27ae60", description: "Case resolved or action taken" },
  { id: "rejected",     label: "Rejected",     color: "#95a5a6", description: "Report rejected — insufficient evidence or false report" },
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
