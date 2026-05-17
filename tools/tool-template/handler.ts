// Vercel Edge Function — deploy via Vercel dashboard or vercel.json
// Runtime: edge  |  Package: @vercel/edge (add to package.json before activating)

export const config = { runtime: "edge" };

export default async function handler(): Promise<Response> {
  return new Response(
    JSON.stringify({
      tool: "template",
      status: "active",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
