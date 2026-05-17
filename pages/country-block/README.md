
# {Name of example} with Vercel Edge Functions

You can use geolocation data to identify a user's country and block content if required.

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

- [Explore the code for this Edge Function](../../pages/country-block.ts)

## View this example on the web

- /example/country-block

