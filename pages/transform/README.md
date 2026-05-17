
# Transform responses with Vercel Edge Functions

You can use Edge Functions to transform the content of an HTTP response. In this example, we transform the response of a
request to `/hello` with JavaScript's <code>toUpperCase()</code> function, using the query parameter
`?method=transform`.

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import { Context } from "@vercel/edge";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);

  // Look for the query parameter, and return if we don't find it
  if (url.searchParams.get("method") !== "transform") {
    return;
  }

  console.log(`Transforming the response from this ${url}`);

  const response = await context.next();

  const text = await response.text();
  return new Response(text.toUpperCase(), response);
};
```

- [Explore the code for this Edge Function](../../pages/transform.ts)

## View this example on the web

- /example/transform

