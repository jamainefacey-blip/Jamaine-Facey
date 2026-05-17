
# Server-Sent Events (SSE) with Vercel Edge Functions

You can use Edge Functions to create a long-running service that can stream data to the browser using [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events). While there is a 50ms limit on CPU time, time spent waiting for a response from an upstream service, or waiting for a timer to expire, does not count towards this limit. This means you can create a long-running service that can stream data to the browser.

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import type { Context } from "@vercel/edge";

export default async (request: Request, context: Context) => {
  let index = 0
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      setInterval(() => {
        controller.enqueue(encoder.encode(`data: Hello ${index++}\n\n`));
      }, 1000);
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
};

```

- [Explore the code for this Edge Function](../../pages/sse.ts)

## View this example on the web

- /example/server-sent-events

