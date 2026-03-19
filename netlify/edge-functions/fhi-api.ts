import type { Config } from "https://edge.netlify.com";

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/fhi", "");

  // Health check
  if (path === "/status" || path === "/") {
    return json({
      system: "Fraud Help Index",
      status: "online",
      version: "1.0.0-mvp",
      node: "Netlify Edge",
    });
  }

  return json({ error: "Not found" }, 404);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export const config: Config = {
  path: "/api/fhi/*",
};
