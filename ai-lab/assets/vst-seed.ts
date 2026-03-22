// ─────────────────────────────────────────────
// AI LAB — VST SEED
// Voyage Smart Travels — Asset Definition
//
// Add source content here before running.
// Replace placeholder strings with actual docs,
// chat transcripts, code, or API specs.
// ─────────────────────────────────────────────

import type { RawAsset } from "../types.ts";

export const VST_ASSET: RawAsset = {
  id: "vst",
  name: "Voyage Smart Travels",
  sources: [
    {
      kind: "doc",
      label: "VST Product Overview",
      content: `
Voyage Smart Travels (VST) is a travel technology platform.
Core purpose: intelligent travel matching, scoring, and compliance.
Backend: built and operational.
Key systems: matching engine, scoring engine, compliance layer.
Frontend: [ADD DETAILS]
Integrations: [ADD DETAILS]
Pricing: [ADD DETAILS]
User flows: [ADD DETAILS]
      `.trim(),
    },
    // Add more sources:
    // { kind: "file", label: "vst-api-spec.json", content: "..." },
    // { kind: "chat", label: "VST architecture discussion", content: "..." },
    // { kind: "repo", label: "vst-backend/src", content: "..." },
  ],
};
