/** @type {import('next').NextConfig} */
// The pages/ directory contains Netlify Edge Function demo templates alongside
// VST Next.js pages (.tsx/.ts). Restricting pageExtensions to .tsx/.ts prevents
// Next.js from scanning the plain-JS Netlify demo files.
//
// Deployed on Vercel as a Next.js app (VST frontend).
// AI Lab panel served from public/ai-lab/ (copied at build time).
const nextConfig = {
  pageExtensions: ["tsx", "ts"],
};

module.exports = nextConfig;
