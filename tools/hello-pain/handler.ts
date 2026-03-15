import type { Config } from "https://edge.netlify.com";

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

export const config: Config = {
  path: "/tools/hello-pain",
};
