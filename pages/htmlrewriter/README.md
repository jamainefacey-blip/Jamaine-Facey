
# Transform HTML responses with Vercel Edge Functions and HTMLRewriter

You can use Edge Functions with the HTMLRewriter library to transform HTML
responses. HTMLRewriter uses WebAssembly to parse a response stream, so is very
efficient. It can parse large HTML pages with minimal overhead, and is a better
choice than using a string transform in most cases. It has an API that uses
familiar CSS selectors to target elements, and can be used to add, remove, or
modify elements.

In this example, we transform an HTML page, replacing the `src` of `<img>` tags
with a placeholder image. We also add content with the user's location. This
shows how to do user personalization when the pages may be static.

## Code example

Edge Functions are files held in the `api/` directory.

```ts
import { Config, Context } from "@vercel/edge";
import { HTMLRewriter } from "https://ghuc.cc/worker-tools/html-rewriter/index.ts";

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  // Only run if the `catify` query parameter is set
  if (!url.searchParams.has("catify")) {
    return;
  }

  const location = context?.geo?.city;

  const response = await context.next();
  const rewriter = new HTMLRewriter()
    .on("#location", {
      element: (element) => {
        element.setInnerContent(`Catified for a visitor in ${location}`);
      },
    })
    .on("img[catify]", {
      element: (element) => {
        const width = element.getAttribute("width") ?? 800;
        const height = element.getAttribute("height") ?? 600;
        element.setAttribute(
          "src",
          `https://placekitten.com/${width}/${height}`
        );
        element.setAttribute("alt", "A random cat");
      },
    });
  return rewriter.transform(response);
}
```

- [Explore the code for this Edge Function](../../pages/htmlrewriter.ts)

## View this example on the web

- /example/htmlrewriter/

