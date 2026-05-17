
# Rewrite with Vercel Edge Functions

You can rewrite requests on one URL to resources available on another URL using an Edge Function.

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import type { Context } from "@vercel/edge";

export default async (request: Request, context: Context) => {
  return new URL("/something-to-serve-with-a-rewrite", request.url);
};
```

- [Explore the code for this Edge Function](../../pages/rewrite.ts)

## View this example on the web

- /example/rewrite

