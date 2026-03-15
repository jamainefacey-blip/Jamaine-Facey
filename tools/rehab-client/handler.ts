import type { Config } from "https://edge.netlify.com";

/**
 * Pain System — Rehab Client App Handler
 *
 * This edge function serves the rehab-client static web app.
 * In Netlify's edge runtime, static files under /tools/rehab-client/
 * are served automatically; this handler provides the entry-point redirect
 * and can be extended later to inject dynamic client data.
 */
export default async function handler(request: Request): Promise<Response> {
  return new Response(
    JSON.stringify({
      tool: "rehab-client",
      status: "active",
      message: "Pain System Rehab Client — serve index.html for this path",
      path: new URL(request.url).pathname,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

export const config: Config = {
  path: "/tools/rehab-client",
};
