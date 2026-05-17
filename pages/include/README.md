
# Edge Includes with Vercel Edge Functions

The ability to transform the content of an HTTP response with Edge Functions enables you to substitute content into
templates as you would with Edge Includes.

In this example, we look for an <code>{{INCLUDE_PRICE_INFO}}</code> placeholder in our response, and replace it with
some other content.

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import { Context } from "@vercel/edge";

export default async (request: Request, context: Context) => {
  // Get the page content
  const response = await context.next();
  const page = await response.text();

  // Search for the placeholder
  const regex = /{{INCLUDE_PRICE_INFO}}/i;

  // Replace the content
  const pricingContent = "It's expensive, but buy it anyway.";
  const updatedPage = page.replace(regex, pricingContent);
  return new Response(updatedPage, response);
};
```

- [Explore the code for this Edge Function](../../pages/include.ts)

## View this example on the web

- /example/includes

