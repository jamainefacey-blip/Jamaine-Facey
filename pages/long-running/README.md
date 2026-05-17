
# Long-running Vercel Edge Functions

Edge Functions are limited to 50ms of CPU time, but this does not include time spent waiting or making network calls. As long as a function returns headers within 40 seconds it can run indefinitely. If you need to make API calls or perform other work that takes longer than this, you can return a stream from the function and write to it when you have the data.

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import type { Context } from "@vercel/edge";

export default (request: Request, context: Context) => {
  const body = new ReadableStream({
    async start(controller) {
      // this might be an API call or other slow external operation
      const response = await doSomethingSlow();
      controller.enqueue(new TextEncoder().encode(response));
      controller.close()
    }
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
};

```

- [Explore the code for this Edge Function](../../pages/sse.ts)

## View this example on the web

- /example/server-sent-events

