
# Set custom HTTP request headers with Vercel Edge Functions

Use an Edge Function to add HTTP headers to any HTTP request at The Edge.

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

- [Explore the code for this Edge Function](../../pages/set-request-header.ts)

## View this example on the web

- /example/set-request-header

