// Vercel Edge Function — deploy via Vercel dashboard or vercel.json
// Runtime: edge  |  Package: @vercel/edge (add to package.json before activating)

export const config = { runtime: "edge" };

export default async function handler(): Promise<Response> {
  return new Response(
    JSON.stringify({
      tool: "hello-pain",
      message: "Pain System tool sandbox operational",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
