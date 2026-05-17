// Vercel Edge Function — deploy via Vercel dashboard or vercel.json
// Runtime: edge  |  Package: @vercel/edge (add to package.json before activating)

export const config = { runtime: "edge" };

/**
 * Pain System — Rehab Client App Handler
 *
 * Serves the rehab-client static web app entry point.
 * Can be extended to inject dynamic client data at the edge.
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
