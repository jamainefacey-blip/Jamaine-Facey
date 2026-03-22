// ─────────────────────────────────────────────
// AI LAB — FHI SEED
// Fraud Help Index — Asset Definition
//
// Add source content here before running.
// FHI has: frontend architecture + partial system.
// ─────────────────────────────────────────────

import type { RawAsset } from "../types.ts";

export const FHI_ASSET: RawAsset = {
  id: "fhi",
  name: "Fraud Help Index",
  sources: [
    {
      kind: "doc",
      label: "FHI Product Overview",
      content: `
Fraud Help Index (FHI) is a consumer fraud detection and reporting platform.
Status: frontend architecture built, partial system.
Core purpose: help users identify, report, and recover from fraud.
Frontend: architecture defined.
Backend: partial — [ADD DETAILS]
Integrations: [ADD DETAILS]
User flows: [ADD DETAILS]
Pricing: [ADD DETAILS]
Data model: [ADD DETAILS]
      `.trim(),
    },
    // Add more sources:
    // { kind: "file", label: "fhi-frontend-spec.md", content: "..." },
    // { kind: "chat", label: "FHI design session", content: "..." },
    // { kind: "repo", label: "fhi-frontend/src", content: "..." },
  ],
};
