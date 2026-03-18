# Venture Template — 60-Second Setup Guide

This kit generates a fully functional static SPA site for any Pain System venture.
Copy the folder, replace the placeholders, done.

---

## Step 1 — Copy the template

```bash
cp -r venture-template/ {{FOLDER_NAME}}/
cd {{FOLDER_NAME}}/
```

---

## Step 2 — Replace all placeholders

Run this script, or do a project-wide find-replace in your editor.

```bash
#!/bin/bash
FOLDER="{{FOLDER_NAME}}"
VENTURE="{{VENTURE_NAME}}"
SLUG="{{VENTURE_SLUG}}"       # e.g. "voyage-smart-travel"  (kebab-case, no spaces)
INITIALS="{{BRAND_INITIALS}}" # e.g. "VST"
DOMAIN="{{VENTURE_DOMAIN}}"   # e.g. "voyagesmarttravel.com"
TAGLINE="{{TAGLINE}}"

find "$FOLDER" -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" \) | while read f; do
  sed -i \
    -e "s/{{VENTURE_NAME}}/$VENTURE/g" \
    -e "s/{{VENTURE_SLUG}}/$SLUG/g" \
    -e "s/{{BRAND_INITIALS}}/$INITIALS/g" \
    -e "s/{{VENTURE_DOMAIN}}/$DOMAIN/g" \
    -e "s/{{TAGLINE}}/$TAGLINE/g" \
    -e "s/VentureComponents/${SLUG//[-]/_}Components/g" \
    -e "s/VentureRouter/${SLUG//[-]/_}Router/g" \
    -e "s/venture-app/$SLUG-app/g" \
    "$f"
done
```

---

## Step 3 — Fill in page content

Each page file has `/* REPLACE: */` comments marking everything that needs real content.
Open each file in `pages/` and replace all `{{PLACEHOLDER}}` tokens with real copy.

### Placeholder reference

| Placeholder | What to put here |
|---|---|
| `{{VENTURE_NAME}}` | Full brand name, e.g. "Voyage Smart Travel" |
| `{{VENTURE_SLUG}}` | Kebab-case ID, e.g. "voyage-smart-travel" |
| `{{BRAND_INITIALS}}` | 2–3 letter mark, e.g. "VST" |
| `{{VENTURE_DOMAIN}}` | Domain without https://, e.g. "voyagesmarttravel.com" |
| `{{TAGLINE}}` | One-line value proposition |
| `{{MISSION}}` | 1–2 sentence mission statement |
| `{{NAV_FEATURES}}` | Nav label for features page, e.g. "Features", "The System" |
| `{{NAV_SAFETY}}` | Nav label for safety page, e.g. "Safety", "Our Approach" |
| `{{CTA_LABEL}}` | Primary CTA label, e.g. "Get Started", "Start Coaching" |
| `{{HERO_TITLE_*}}` | Hero title lines — use `<span>` for gold emphasis |
| `{{HERO_SUB}}` | Hero sub-heading — 1–2 sentences, no hype |
| `{{FEATURE_*_TITLE/DESC}}` | Feature card titles and descriptions |
| `{{STAT_*_VALUE/LABEL}}` | Trust strip and stat block values |
| `{{STEP_*_TITLE/DESC}}` | How-it-works step titles and descriptions |
| `{{CHECK_*}}` | Check-list items |
| `{{PARTNER_*_NAME/DESC}}` | Partner type names and descriptions |
| `{{CONTACT_*}}` | Contact form labels, placeholders, success message |
| `{{A11Y_CONTENT_CHECK_*}}` | Content accessibility commitments |
| `{{ENQUIRY_TYPE_*}}` | Contact form enquiry type dropdown options |
| `{{CONTACT_CHANNEL_*_LABEL/EMAIL}}` | Contact channel rows — real email addresses |
| `{{RESPONSE_TYPE_*/TIME_*}}` | Response time commitment rows |
| `{{CALLOUT_*}}` | Callout boxes — scope boundaries, honest notes |

---

## Step 4 — Rename page files (if needed)

If you renamed the features or safety pages (e.g. to "offering" or "approach"):

1. Rename the file: `mv pages/features.js pages/offering.js`
2. Rename the function: `window.renderFeatures` → `window.renderOffering`
3. Update `index.html` script tag: `pages/offering.js`
4. Update `router.js` ROUTES key: `'features'` → `'offering'`
5. Update nav links in `index.html`: `data-route="offering"`, `href="#offering"`

---

## Step 5 — Commit and push

```bash
git add {{FOLDER_NAME}}/
git commit -m "feat: add {{VENTURE_NAME}} site"
git push -u origin claude/{{VENTURE_SLUG}}-site-Wq7fZ
```

---

## Architecture notes

- **Pure vanilla JS** — no framework, no build step, no dependencies.
- **Script load order** — `components.js` → `pages/*.js` → `router.js`. Do not change this.
- **Window globals** — each venture uses its own `window.XxxComponents` and `window.XxxRouter` namespace. Never share runtimes between ventures.
- **CSS tokens** — all brand values live in `:root` in `css/styles.css`. Change `--accent` once to retheme the entire site.
- **Static / Netlify-ready** — no server required. Deploy by dropping the folder in Netlify, Vercel, or any static host.
- **Hash routing** — all navigation uses `window.location.hash`. No 404 issues on static hosts.

---

## 60-second generator prompt

Use this prompt with Claude to generate a new venture site in one pass:

```
PAIN SYSTEM — 60 SECOND VENTURE BUILD

Clone the venture-template kit and build a complete static SPA site for:

VENTURE_NAME:    {{VENTURE_NAME}}
FOLDER_NAME:     {{FOLDER_NAME}}
TAGLINE:         {{TAGLINE}}
MISSION:         {{MISSION}}
FEATURE_LIST:    {{FEATURE_LIST}}
TARGET_USERS:    {{TARGET_USERS}}
PARTNERS:        {{PARTNERS}}
ACCESSIBILITY:   {{ACCESSIBILITY}}
CONTACT_PURPOSE: {{CONTACT_PURPOSE}}

Design tokens: --bg: #09101f | --accent: #d4a853 | --text: #e2e8f0

Rules:
- Isolated folder. No shared runtime with other ventures.
- No lorem ipsum. No fake testimonials. No dashboards. No payment system. No backend.
- Mobile-first. WCAG 2.1 AA. Netlify-compatible.
- Commit to branch: claude/{{FOLDER_NAME}}-site-Wq7fZ
```
