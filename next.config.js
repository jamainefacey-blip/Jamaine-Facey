/** @type {import('next').NextConfig} */
// The pages/ directory contains Netlify Edge Function demo templates, NOT
// Next.js pages. Restricting pageExtensions to .tsx/.ts prevents Next.js from
// scanning those plain-JS files and failing the build.
//
// This project is deployed as a static site (tools/rehab-client).
// next is installed as a dependency but not used as the primary framework.
const nextConfig = {
  pageExtensions: ["tsx", "ts"],
};

module.exports = nextConfig;
