
# Access Site Information from Edge Functions

Vercel Edge Functions give access to site information via `context.site`.

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import type { Context } from "@vercel/edge";

export default async (request: Request, context: Context) => {
  return new Response(`Hello from ${context.site.name}!`);
};
```

- [Explore the code for this Edge Function](../../pages/context-site.ts)

## View this example on the web

- /example/context-site

