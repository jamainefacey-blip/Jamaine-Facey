
# Logging with Vercel Edge Functions

Output content to the logs from an Edge Function using `console.log()`.

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import type { Context } from "@vercel/edge";

export default async (request: Request, context: Context) => {
  console.log("Hello from the logging service");
};
```

- [Explore the code for this Edge Function](../../pages/log.ts)

## View this example on the web

- /example/log

