export default function head({ title, metaDescription, url }) {
  return `
    <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Meta -->
    <title>${title} | Pain System Hub</title>
    <meta name="description" content="${metaDescription}" />

    <!-- Favicons -->
    <meta name="theme-color" content="#ffffff" />
    <link rel="icon" href="/favicon.svg" />
    <link rel="mask-icon" href="/mask-icon.svg" color="#000000" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.json" />

    <!-- Open Graph -->
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${metaDescription}" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:site_name" content="Pain System Hub" />

    <script src="/lib/highlight.min.js"></script>
    <script>hljs.highlightAll();</script>
  </head>
  `;
}
