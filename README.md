# Pain System Hub

Sandbox environment for building and testing portable modules for the Pain System platform.

**Deployment platform: Vercel (exclusively)**

Netlify has been decommissioned. All deployments, edge functions, and CDN routing are handled by Vercel. Do not add Netlify configuration to this repository.

## File Structure

```
.
├── package.json                        # Project metadata
├── components/                         # Shared UI components (plain JS)
│   ├── head.js                         # HTML <head> tag
│   ├── header.js                       # Site navigation/header
│   ├── footer.js                       # Page footer
│   ├── layout.js                       # Full page shell
│   ├── geolocation-info.js             # Geolocation UI card
│   └── repo-link.js                    # Source link component
│
├── pages/                              # Demo page UI (one subdirectory per demo)
│   └── <demo-name>/
│       ├── index.js                    # Page renderer
│       └── README.md                   # Demo documentation
│
├── public/                             # Static assets (Vercel publish directory)
│
├── tools/                              # Pain System sandbox tools
│   ├── hello-pain/                     # Hello Pain health-check tool
│   └── rehab-client/                   # Rehab Client SPA
│
├── voyage-smart-travel/                # Voyage Smart Travel sub-project (Vercel)
│   └── vercel.json
│
└── pain-system/
    └── CLAUDE.md                       # Deployment policy and platform standards
```

## Modules

See [MODULE_REGISTRY.md](MODULE_REGISTRY.md) for all registered sandbox modules.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jamainefacey-blip/Jamaine-Facey)
