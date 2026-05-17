
# JSON Response with Vercel Edge Functions

You can use Edge Functions to return a JSON response by returning `Response.json()` with a JavaScript object — no need to
`JSON.stringify`!

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import type { Context } from "@vercel/edge";

export default async (request: Request, context: Context) => {
  return Response.json({ hello: "world" });
};
```

- [Explore the code for this Edge Function](../../pages/json.ts)

## View this example on the web

- /example/json

