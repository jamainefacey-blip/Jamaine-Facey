
# Use environment variables with Vercel Edge Functions

Vercel Edge Functions support open-source Deno APIs. To access your Vercel environment variables in Edge Functions,
use the `process.env` API.

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import type { Context } from "@vercel/edge";

export default async (request: Request, context: Context) => {
  const value = process.env.get("MY_IMPORTANT_VARIABLE");

  return new Response(&grave;Value of MY_IMPORTANT_VARIABLE is "&dollar;{value}".&grave;, {
    headers: { "content-type": "text/html" },
  });
};
```

- [Explore the code for this Edge Function](../../pages/environment.ts)

## View this example on the web

- /example/environment

