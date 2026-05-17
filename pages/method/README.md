
# Configure for specific HTTP methods

With in-source configuration, you can restrict Edge Functions to respond to certain HTTP methods.

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import type { Config, Context } from "@vercel/edge";

export default async (request: Request, context: Context) => {

  return new Response(`This is a response to a ${request.method} request`)
};

export const config: Config = {
  method: ["POST", "PUT"]
}
```

- [Explore the code for this Edge Function](../../pages/method.ts)

## View this example on the web

- /example/method

When viewed through a browser, the URL should 404. To validate that it works, you can use a CURL by running the following command in a terminal:

```
curl -X POST /example/method
```

or

```
curl -X PUT /example/method
```


