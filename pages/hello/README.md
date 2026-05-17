
# Hello, World! with Vercel Edge Functions

You can use Edge Functions to return a plain HTTP text/html response. In this example, we return the string "Hello,
World!" as text/html.

## Code example

Edge Functions are files held in the `api/` directory.

```js
export default async (request) => {
  return new Response("Hello, World!", {
    headers: { "content-type": "text/html" },
  });
};
```

- [Explore the code for this Edge Function](../../pages/hello.js)

## View this example on the web

- /example/hello

