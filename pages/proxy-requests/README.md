
# Proxy requests to another source

You can use [fetch()](https://developer.mozilla.org/en-US/docs/Web/API/fetch) to make requests to other sources via an
Edge Function.

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import { Context } from "@vercel/edge";

export default async (request: Request, context: Context) => {
  const joke = await fetch("https://icanhazdadjoke.com/", {
    headers: {
      Accept: "application/json",
    },
  });
  const jsonData = await joke.json();
  return Response.json(jsonData);
};
```

- [Explore the code for this Edge Function](../../pages/proxy-requests.ts)

## View this example on the web

- /example/proxy-requests.ts

