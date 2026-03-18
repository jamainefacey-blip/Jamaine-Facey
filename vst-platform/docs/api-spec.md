# VST Platform — API Specification

Base URL: `https://api.voyagesmarttravel.com/v1`
Auth: Clerk JWT via `Authorization: Bearer <token>`

---

## Auth & Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/webhooks/clerk` | Clerk sig | Sync Clerk user to DB on create/update/delete |
| GET | `/users/me` | Required | Get current user profile + preferences |
| PATCH | `/users/me/profile` | Required | Update profile |
| PATCH | `/users/me/preferences` | Required | Update travel & notification preferences |
| GET | `/users/me/safety-contacts` | Required | List safety contacts |
| POST | `/users/me/safety-contacts` | Required | Add safety contact |
| PATCH | `/users/me/safety-contacts/:id` | Required | Update contact |
| DELETE | `/users/me/safety-contacts/:id` | Required | Remove contact |
| GET | `/users/me/passport` | Required | Get passport record |
| PUT | `/users/me/passport` | Required | Create or update passport |

---

## Booking Engine

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search/flights` | Optional | Search flights (proxies Skyscanner) |
| GET | `/search/hotels` | Optional | Search hotels (proxies Booking.com) |
| POST | `/bookings` | Required | Record a booking (after affiliate redirect) |
| GET | `/bookings` | Required | List user bookings |
| GET | `/bookings/:id` | Required | Get booking detail |
| POST | `/price-alerts` | Required | Create price alert |
| GET | `/price-alerts` | Required | List user price alerts |
| DELETE | `/price-alerts/:id` | Required | Delete price alert |

---

## SOS Safety System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sos` | Required | Trigger SOS event |
| GET | `/sos/:id` | Required | Get SOS event status |
| PATCH | `/sos/:id/resolve` | Required | Mark SOS as resolved |
| POST | `/check-ins` | Required | Submit check-in |
| GET | `/check-ins` | Required | List check-ins |

---

## Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | Required | List user notifications |
| PATCH | `/notifications/:id/read` | Required | Mark as read |
| POST | `/notifications/push/subscribe` | Required | Register push subscription |
| DELETE | `/notifications/push/subscribe` | Required | Unregister push subscription |

---

## Membership & Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/membership` | Required | Get current membership + tier |
| GET | `/membership/plans` | None | List all plans + pricing |
| POST | `/membership/subscribe` | Required | Create Stripe checkout session |
| POST | `/membership/portal` | Required | Open Stripe billing portal |
| POST | `/webhooks/stripe` | Stripe sig | Handle Stripe subscription events |
| GET | `/payments` | Required | List payment history |

---

## Visa & Embassy

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/visa/check` | Optional | `?passport=GB&destination=TH` — returns visa type + notes |
| GET | `/destinations` | None | List all destinations |
| GET | `/destinations/:countryCode` | None | Get destination detail |
| GET | `/destinations/:countryCode/embassies` | None | List embassies in destination |

---

## Community

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/reviews` | None | List reviews `?destination=TH&page=1` |
| POST | `/reviews` | Required | Submit review |
| PATCH | `/reviews/:id` | Required | Update own review |
| DELETE | `/reviews/:id` | Required | Delete own review |
| POST | `/reviews/:id/reply` | Partner | Partner right-to-reply |
| POST | `/reviews/:id/media` | Required | Upload media to review |

---

## Explorer Map

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/explorer/pins` | None | List published pins `?bbox=lng,lat,lng,lat` |
| GET | `/explorer/pins/:id` | None | Get pin detail |
| POST | `/explorer/pins` | Required | Submit community pin |
| PATCH | `/explorer/pins/:id` | Admin | Publish/unpublish pin |

---

## Partners & Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/partners` | Admin | Register partner |
| GET | `/partners` | Admin | List partners |
| GET | `/partners/:id` | Admin/Partner | Get partner detail |
| POST | `/partners/:id/campaigns` | Admin | Create campaign |
| GET | `/partners/:id/campaigns` | Admin/Partner | List campaigns |
| GET | `/affiliates/track` | None | Record affiliate click `?code=xyz` |
| GET | `/admin/analytics` | Admin | Platform analytics summary |

---

## Rate Limits

| Tier | Limit |
|------|-------|
| Unauthenticated | 30 req/min |
| Guest | 60 req/min |
| Premium | 300 req/min |
| Voyage Elite | 600 req/min |
| Partner/Admin | 1000 req/min |

---

## Error Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    { "field": "email", "message": "must be a valid email" }
  ]
}
```
