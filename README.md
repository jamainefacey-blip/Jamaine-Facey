![Netlify examples](https://github.com/netlify/edge-functions-examples/assets/7912948/d34a626d-1c65-492d-bb14-85f50d9b72cb)


# [Netlify Edge Functions](https://www.netlify.com/products/?utm_campaign=devex&utm_source=edge-functions-examples&utm_medium=github&utm_content=Edge%20Functions%20Product%20Page#netlify-edge-functions) Examples

Explore these examples here: https://edge-functions-examples.netlify.app/

## Responses

- [Hello, world](pages/hello)
- [Return JSON](pages/json)
- [Return an image](pages/image)

## Rewrites and proxies

- [Rewrite responses from another URL](pages/rewrite)
- [Proxy requests to another source](pages/proxy-requests)

## HTTP Headers

- [Set custom HTTP request headers](pages/set-request-header)
- [Set custom HTTP response headers](pages/set-response-header)

## Transforming responses

- [HTML transformation](pages/htmlrewriter)
- [Text transformation](pages/transform)
- [Content includes](pages/include)

## Geolocation

- [Determine a user's location](pages/geolocation)
- [Block content according to country](pages/country-block)
- [Serve localized content](pages/localized-content)

## Cookies

- [Set cookies](pages/cookies-set)
- [Read cookies](pages/cookies-read)
- [Delete cookies](pages/cookies-delete)
- [Set up an A/B test using cookies](pages/abtest)

## Streams
- [Long-running edge functions](pages/long-running)
- [Server-sent events](pages/server-sent-events)

## WebAssembly
- [Edge WebAssembly](pages/wasm)

## Environment and debugging

- [Write to the logs](pages/log)
- [Use environment variables](pages/environment)

---

## File Structure

```
.
├── netlify.toml                        # Netlify config: publish dir, redirects, edge function routes
├── package.json                        # Project metadata (no build scripts, no runtime deps)
├── package-lock.json / pnpm-lock.yaml  # Dependency lockfiles
│
├── components/                         # Shared UI components (plain JS, server-rendered HTML)
│   ├── head.js                         # HTML <head> tag (meta, styles, fonts)
│   ├── header.js                       # Site top navigation/header bar
│   ├── footer.js                       # Page footer
│   ├── layout.js                       # Full page shell wrapping head + header + footer
│   ├── deploy-button.js                # "Deploy to Netlify" button component
│   ├── geolocation-info.js             # UI card for displaying geolocation data
│   └── repo-link.js                    # Link to the demo's source code on GitHub
│
├── netlify/edge-functions/             # Edge function handlers (Deno-compatible, run at CDN edge)
│   ├── [page].js                       # Dynamic catch-all — routes requests to page handlers
│   ├── hello.js                        # Returns a "Hello World" HTTP response
│   ├── json.ts                         # Returns a JSON response body
│   ├── abtest.ts                       # A/B testing via cookies (splits traffic between variants)
│   ├── context-site.ts                 # Reads Netlify context.site info (name, URL, deploy ID)
│   ├── cookies.ts                      # Shared cookie utility used by cookie demos
│   ├── country-block.ts                # Blocks access based on user's detected country
│   ├── environment.ts                  # Reads and displays Netlify environment variables
│   ├── error.ts                        # Demonstrates uncaught exception/error handling
│   ├── geolocation.ts                  # Reads geo data from request context
│   ├── htmlrewriter.ts                 # Transforms HTML responses on the fly
│   ├── image-external.ts              # Fetches and returns an image from an external URL
│   ├── image-internal.ts              # Fetches and returns an image from within the same site
│   ├── include.ts                      # Edge-side content includes (ESI-like pattern)
│   ├── localized-content.js            # Serves different content based on user's locale/country
│   ├── log.ts                          # Writes to Netlify edge function logs
│   ├── long-running.ts                 # Streaming for long-running edge function responses
│   ├── method.ts                       # Reads the HTTP request method (GET, POST, etc.)
│   ├── proxy-requests.ts               # Proxies a request to a different upstream origin
│   ├── rewrite.ts                      # Rewrites request URL to serve content from another path
│   ├── set-request-header.ts           # Adds custom headers to the upstream request
│   ├── set-response-header.ts          # Adds custom headers to the HTTP response
│   ├── sse.ts                          # Server-Sent Events (SSE) streaming
│   ├── transform.ts                    # Global text/HTML response transformation (runs on /*.*)
│   └── wasm.ts                         # Loads and executes a WebAssembly module at the edge
│
├── pages/                              # Demo page UI (one subdirectory per demo)
│   ├── home/index.js                   # Homepage listing all demos
│   └── <demo-name>/
│       ├── index.js                    # Page frontend logic / HTML renderer
│       └── README.md                   # Explains the demo and how the edge function works
│                                       # (demos: abtest, context-site, cookies-set/read/delete,
│                                       #  country-block, environment, geolocation, hello,
│                                       #  htmlrewriter, image, include, json, localized-content,
│                                       #  log, long-running, method, proxy-requests, rewrite,
│                                       #  server-sent-events, set-request-header,
│                                       #  set-response-header, transform, uncaught-exceptions, wasm)
│
└── public/                             # Static assets (Netlify publish directory)
    ├── a-static-page.html              # Plain static page used in rewrite/include demos
    ├── some-content-page.html          # Static page for demo use
    ├── something-to-serve-with-a-rewrite.html  # HTML served via the rewrite demo
    ├── manifest.json                   # PWA web app manifest
    ├── favicon.svg / icon.svg          # Site favicon and icon
    ├── icon-192.png / icon-512.png     # PWA icons
    ├── apple-touch-icon.png            # iOS home screen icon
    ├── mask-icon.svg                   # Safari pinned tab icon
    ├── img/icons.svg                   # SVG icon sprite
    ├── img/screenshot-error-page.png   # Screenshot used in the error demo README
    └── lib/highlight.min.js            # Syntax highlighting library for demo pages
```

### Architecture

```
Request
  └─> Netlify CDN Edge
        └─> netlify/edge-functions/transform.ts  (global, runs on every /*)
              └─> Routes to specific edge function per path
                    └─> Renders HTML via components/ + pages/
                          └─> Falls back to public/ for static assets
```

This is a **no-build, no-framework** site. There is no bundler or compiler — pages are rendered by plain JS functions. All the interesting logic lives in the edge functions.

---

## Deploy this site to Netlify

Click this button to deploy this site automatically to your Netlify account.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify/examples/&create_from_path=examples/edge-functions/&utm_campaign=dx-examples&utm_source=edge-functions-examples&utm_medium=web&utm_content=Deploy%20Edge%20Functions%20Examples%20to%20Netlify)
