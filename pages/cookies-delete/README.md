
# Read, write, and delete cookies with Vercel Edge Functions

Manipulate HTTP cookies

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import type { Context } from "@vercel/edge";

export default async (request: Request, context: Context) => {
  // Set a cookie
  context.cookies.set({
    name: "My cookie",
    value: "hello",
  });

  // Delete a cookie
  context.cookies.delete("My cookie");

  // Read the value of a cookie
  const value = context.cookies.get("My cookie");
};
```

- [Explore the code for this Edge Function](../../pages/cookies.ts)

## View this example on the web

- /example/cookies-delete

