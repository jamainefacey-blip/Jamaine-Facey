import type { Config } from "https://edge.netlify.com";

export default async function handler(): Promise<Response> {
  return new Response(
    JSON.stringify({
      system: "Pain System",
      status: "online",
      node: "Netlify Edge Sandbox",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

export const config: Config = {
  path: "/pain-system",
};
