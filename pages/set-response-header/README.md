
# Set custom HTTP response headers with Vercel Edge Functions

Use an Edge Function to add HTTP headers to any HTTP response at The Edge.

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import type { Context } from "@vercel/edge";

export default async (request: Request, context: Context) => {
  const response = await context.next();
  response.headers.set("X-Your-Custom-Header", "A custom header value");
  return response;
};
```

- [Explore the code for this Edge Function](../../pages/set-response-header.ts)

## View this example on the web

- /example/set-response-header

