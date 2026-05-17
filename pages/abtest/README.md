
# A/B Test with Vercel Edge Functions

A/B tests are a great way to test new features on your site. A basic A/B test works by assigning visitors to a
particular test "bucket" the first time they visit a site, usually using a random number between 0 and 1.

Visitors can then be redirected to different pages, depending on the bucket and cookie they were assigned.

You could even use A/B testing in combination with Geolocation at The Edge!

## Code example

Edge Functions are files held in the `api/` directory.

- [Explore the code for this Edge Function](../../pages/abtest.ts)

## View this example on the web

- /example/abtest

