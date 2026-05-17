
# Serve localized content with Vercel Edge Functions

You can use geolocation data to serve localized content according to country code.

## Code example

Geolocation information is available on the `Context.geo` object.

```javascript
context: {
  geo: {
    city?: string;
    country?: {
      code?: string;
      name?: string;
    },
    subdivision?: {
      code?: string;
      name?: string;
    },
  }
}
```

Edge Functions are files held in the `api/` directory.

- [Explore the code for this Edge Function](../../pages/localized-content.js)

## View this example on the web

- /example/localized-content

