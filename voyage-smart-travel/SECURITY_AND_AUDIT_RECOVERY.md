# Voyage Smart Travel — Security and Audit Recovery

**Status:** ACTION REQUIRED  
**Date:** 2026-07-16  
**Source repository:** `jamainefacey-blip/Jamaine-Facey`  
**Application path:** `voyage-smart-travel/`  
**Canonical Vercel project:** `voyage-smart-travel`  
**Canonical public domain:** `https://voyagesmarttravel.com`

## Correct access map

Voice Smart Travel is a module of Voyage Smart Travel. It is not a separate repository.
The VST source is stored in this repository under `voyage-smart-travel/`.

A source-level audit must use this repository and path. The `ava-pain-system` repository
contains the self-audit runner, but it is not the VST source repository.

## Verified live audit result

GitHub Actions run `29487934436` successfully audited both owned public properties.
Voyage Smart Travel was reachable and scored 85/100. The root-page finding was a missing
canonical URL tag. The homepage source already contains description and Open Graph tags.

## P0 security finding

`voyage-smart-travel/api/run-migrations.js` is labelled temporary but remains present and
is exposed through the root `api/run-migrations.js` proxy.

Current source review found:

- a static migration access token committed in source;
- permissive cross-origin response headers;
- GET and POST support;
- credential-bearing request headers;
- an environment-variable-name inspection mode;
- a connectivity-probe mode;
- optional derivation of a service-role JWT from `JWT_SECRET`;
- embedded DDL for production tables.

Do not print, reuse, or copy the committed token. Treat it as compromised.

A direct database read on 2026-07-16 found none of the nine expected VST tables in the
current Supabase project's public schema, so migration completion must not be assumed.
The unsafe endpoint should not remain public merely because the migrations are incomplete.

## Required governed work order

1. Recover current `main`, open PRs, Vercel project configuration, and Supabase state.
2. Confirm the canonical VST deployment and domain; classify `voyage-smart-travel-live`
   as ACTIVE, DUPLICATE, or RETIRE-CANDIDATE with evidence. Do not delete it blindly.
3. Immediately neutralise the temporary public migration endpoint and root proxy.
4. Rotate or revoke any credential or token that may have been exposed or derivable.
5. Preserve the SQL migration files, but replace the public endpoint with a secure,
   operator-controlled migration path using existing approved infrastructure.
6. Apply migrations only after independent review and explicit production approval.
7. Verify all expected tables, RLS policies, triggers, and least-privilege boundaries.
8. Add page-specific canonical tags, beginning with the homepage canonical
   `https://voyagesmarttravel.com/`; do not point every page to the homepage.
9. Run a full source and live audit covering accessibility, security, SEO, API routes,
   planner functionality, domain redirects, duplicate deployments, and production errors.
10. Re-run the existing AVA self-audit workflow and store the before/after evidence.

## Acceptance evidence

- temporary migration endpoint is unreachable;
- compromised token is no longer accepted anywhere;
- no credential values or environment inventory are exposed;
- secure migration execution has an approval boundary and audit receipt;
- nine expected VST tables and RLS state are verified, or honestly reported blocked;
- page-specific canonical tags render on the live site;
- `voyagesmarttravel.com` is confirmed as the canonical domain;
- duplicate Vercel project decision is recorded;
- independent exact-head review completed;
- no production merge or migration without the required approval.

## Founder-safe completion report

Return only:

```
REPOSITORY:
BRANCH:
PR:
HEAD_SHA:
CANONICAL_VERCEL_PROJECT:
DUPLICATE_PROJECT_DECISION:
MIGRATION_ENDPOINT_STATUS:
CREDENTIAL_ROTATION_STATUS:
DATABASE_TABLE_STATUS:
CANONICAL_TAG_STATUS:
LIVE_AUDIT_SCORE:
SECURITY_AUDIT_VERDICT:
INDEPENDENT_REVIEW:
BLOCKERS:
MERGE_READY:
NEXT_ACTION:
```
