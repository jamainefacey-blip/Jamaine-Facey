
# Geolocation with Vercel Edge Functions

You can use Edge Functions to get information about a user's location to serve location-specific content and personalize
their experience.

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

## Code example

Edge Functions are files held in the `api/` directory.

- [Explore the code for this Edge Function](../../pages/geolocation.ts)

## View this example on the web

- /example/geolocation

