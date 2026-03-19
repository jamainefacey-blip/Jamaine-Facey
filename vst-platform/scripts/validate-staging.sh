#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# VST Platform — Phase 6 Authenticated Staging Validation
#
# USAGE
# ─────────────────────────────────────────────────────────────────────────────
#   export API_BASE="http://localhost:3001"        # or deployed staging URL
#   export DATABASE_URL="postgresql://vst_user:pass@host/vst_staging"
#   export PREMIUM_TOKEN="<Clerk JWT for premium@vst-staging.test>"
#   export GUEST_TOKEN="<Clerk JWT for guest@vst-staging.test>"
#   bash scripts/validate-staging.sh
#
# WHAT THIS DOES
# ─────────────────────────────────────────────────────────────────────────────
#   Runs all 25 Phase 6 validation tests in order.
#   Prints PASS / FAIL for each with reason.
#   Exits 0 if all pass, 1 if any fail.
#   Does not modify DB state except via the API under test.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

API="${API_BASE:-http://localhost:3001}"
PASS=0
FAIL=0
FAILURES=""

# ── Colour output ─────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
RESET='\033[0m'

# ── Guards ────────────────────────────────────────────────────────────────────
if [[ -z "${PREMIUM_TOKEN:-}" || -z "${GUEST_TOKEN:-}" ]]; then
  echo -e "${RED}ERROR: PREMIUM_TOKEN and GUEST_TOKEN must be set.${RESET}"
  echo "  export PREMIUM_TOKEN='<JWT>'"
  echo "  export GUEST_TOKEN='<JWT>'"
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo -e "${YELLOW}WARN: DATABASE_URL not set — DB verification steps will be skipped.${RESET}"
fi

# ── Helpers ───────────────────────────────────────────────────────────────────
assert() {
  local label="$1" expected_status="$2" actual_status="$3" body="$4" body_check="${5:-}"
  if [[ "$actual_status" != "$expected_status" ]]; then
    echo -e "  ${RED}FAIL${RESET} $label — expected HTTP $expected_status, got $actual_status"
    echo "       body: ${body:0:120}"
    FAIL=$((FAIL + 1))
    FAILURES="$FAILURES\n  ✗ $label (HTTP $actual_status ≠ $expected_status)"
    return
  fi
  if [[ -n "$body_check" && "$body" != *"$body_check"* ]]; then
    echo -e "  ${RED}FAIL${RESET} $label — body missing: '$body_check'"
    echo "       body: ${body:0:120}"
    FAIL=$((FAIL + 1))
    FAILURES="$FAILURES\n  ✗ $label (body missing '$body_check')"
    return
  fi
  echo -e "  ${GREEN}PASS${RESET} $label"
  PASS=$((PASS + 1))
}

db_query() {
  [[ -z "${DATABASE_URL:-}" ]] && { echo "  SKIP (no DATABASE_URL)"; return; }
  psql "$DATABASE_URL" -tAc "$1" 2>/dev/null || echo ""
}

http() {
  local method="$1" path="$2" token="$3" body="${4:-}"
  if [[ -n "$body" ]]; then
    curl -s -o /tmp/vst_resp -w "%{http_code}" \
      -X "$method" "${API}${path}" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -s -o /tmp/vst_resp -w "%{http_code}" \
      -X "$method" "${API}${path}" \
      -H "Authorization: Bearer $token"
  fi
}

resp() { cat /tmp/vst_resp 2>/dev/null || echo ""; }

echo ""
echo "═══════════════════════════════════════════════════════════"
echo " VST Phase 6 — Authenticated Staging Validation"
echo " Target: $API"
echo "═══════════════════════════════════════════════════════════"

# ── A. LONG WAY ROUND: Premium flow ──────────────────────────────────────────
echo ""
echo "─── A. Long Way Round (Premium) ───────────────────────────"

STATUS=$(http POST "/v1/matching/lwr" "$PREMIUM_TOKEN" '{"name":"Validation Route"}')
BODY=$(resp)
assert "A1 Create route (Premium → 201)" "201" "$STATUS" "$BODY" '"status":"DRAFT"'
ROUTE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -n "$ROUTE_ID" ]]; then
  STATUS=$(http POST "/v1/matching/lwr/$ROUTE_ID/stops" "$PREMIUM_TOKEN" \
    '{"position":1,"destinationCode":"JP","destinationName":"Tokyo","durationDays":7}')
  BODY=$(resp)
  assert "A2 Add stop 1 (JP → 201)" "201" "$STATUS" "$BODY" '"destinationCode":"JP"'
  STOP_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  STATUS=$(http POST "/v1/matching/lwr/$ROUTE_ID/stops" "$PREMIUM_TOKEN" \
    '{"position":2,"destinationCode":"TH","destinationName":"Bangkok","durationDays":5}')
  BODY=$(resp)
  assert "A3 Add stop 2 (TH → 201)" "201" "$STATUS" "$BODY" '"destinationCode":"TH"'

  STATUS=$(http PATCH "/v1/matching/lwr/$ROUTE_ID" "$PREMIUM_TOKEN" \
    '{"name":"Japan-Thailand 2026","totalDays":12}')
  BODY=$(resp)
  assert "A4 Update route metadata (→ 200)" "200" "$STATUS" "$BODY" '"Japan-Thailand 2026"'

  STATUS=$(http PATCH "/v1/matching/lwr/$ROUTE_ID/status" "$PREMIUM_TOKEN" '{"status":"PLANNED"}')
  BODY=$(resp)
  assert "A5 Advance to PLANNED (→ 200)" "200" "$STATUS" "$BODY" '"PLANNED"'

  STATUS=$(http PATCH "/v1/matching/lwr/$ROUTE_ID/status" "$PREMIUM_TOKEN" '{"status":"COMPLETED"}')
  BODY=$(resp)
  assert "A6 Illegal transition PLANNED→COMPLETED (→ 400)" "400" "$STATUS" "$BODY"

  STATUS=$(http GET "/v1/matching/lwr/$ROUTE_ID" "$PREMIUM_TOKEN")
  BODY=$(resp)
  assert "A7 Get route shows 2 stops (→ 200)" "200" "$STATUS" "$BODY" '"stops":'

  STATUS=$(http GET "/v1/matching/lwr/$ROUTE_ID/analyse" "$PREMIUM_TOKEN")
  BODY=$(resp)
  assert "A8 Analyse returns stub (→ 200)" "200" "$STATUS" "$BODY" '"STUB"'

  if [[ -n "${STOP_ID:-}" ]]; then
    STATUS=$(http DELETE "/v1/matching/lwr/$ROUTE_ID/stops/$STOP_ID" "$PREMIUM_TOKEN")
    BODY=$(resp)
    assert "A9 Remove stop (→ 200)" "200" "$STATUS" "$BODY"
  else
    echo -e "  ${YELLOW}SKIP${RESET} A9 Remove stop — no STOP_ID captured"
  fi

  STATUS=$(http DELETE "/v1/matching/lwr/$ROUTE_ID" "$PREMIUM_TOKEN")
  BODY=$(resp)
  assert "A10 Delete route (→ 200)" "200" "$STATUS" "$BODY"
else
  echo -e "  ${YELLOW}SKIP${RESET} A2–A10 — ROUTE_ID not captured (A1 failed)"
  FAIL=$((FAIL + 9))
fi

# ── B. LONG WAY ROUND: Guest write rejection ──────────────────────────────────
echo ""
echo "─── B. Long Way Round (Guest rejection) ───────────────────"

STATUS=$(http POST "/v1/matching/lwr" "$GUEST_TOKEN" '{"name":"Guest attempt"}')
BODY=$(resp)
assert "B1 Guest create blocked (→ 403)" "403" "$STATUS" "$BODY"

STATUS=$(http GET "/v1/matching/lwr" "$GUEST_TOKEN")
BODY=$(resp)
assert "B2 Guest list routes allowed (→ 200)" "200" "$STATUS" "$BODY"

# ── C. AVA OPPORTUNITY QUERY ──────────────────────────────────────────────────
echo ""
echo "─── C. Ava Opportunity Query ───────────────────────────────"

STATUS=$(http POST "/v1/ava/query" "$PREMIUM_TOKEN" \
  '{"message":"suggest a trip","context":{"mode":"LONG_DISTANCE"}}')
BODY=$(resp)
assert "C1 Ava intent=OPPORTUNITY_QUERY (→ 200)" "200" "$STATUS" "$BODY" '"OPPORTUNITY_QUERY"'

STATUS=$(http POST "/v1/ava/query" "$PREMIUM_TOKEN" \
  '{"message":"what fits my free time","context":{"mode":"LOCAL","location":{"lat":51.51,"lng":-0.12}}}')
BODY=$(resp)
assert "C2 Ava LOCAL returns live event (→ 200)" "200" "$STATUS" "$BODY" '"OPPORTUNITY_QUERY"'
# Additional content check
if echo "$BODY" | grep -qiE "Southbank|Jazz|Shoreditch|Hyde Park"; then
  echo -e "       ${GREEN}✓${RESET} Live event name found in reply"
else
  echo -e "       ${YELLOW}⚠${RESET}  Reply may use fallback seeds — check destinationName fields"
fi

STATUS=$(http POST "/v1/ava/query" "$GUEST_TOKEN" \
  '{"message":"recommend somewhere","context":{"mode":"LONG_DISTANCE"}}')
BODY=$(resp)
assert "C3 Ava Guest returns 200 (not 403)" "200" "$STATUS" "$BODY"

# ── D. LOCAL MATCHING QUALITY ─────────────────────────────────────────────────
echo ""
echo "─── D. Local Matching Quality ──────────────────────────────"

STATUS=$(http GET "/v1/matching/opportunities?mode=LOCAL&lat=51.51&lng=-0.12" "$PREMIUM_TOKEN")
BODY=$(resp)
assert "D1 LOCAL opportunities (→ 200)" "200" "$STATUS" "$BODY" '"opportunities":'
if echo "$BODY" | grep -qiE "Southbank|Jazz|Shoreditch|Hyde Park|Rooftop|Speakeasy"; then
  echo -e "       ${GREEN}✓${RESET} Live seeded event/pin found in results"
else
  echo -e "       ${YELLOW}⚠${RESET}  No seeded event/pin detected — check live seeds vs fallback"
fi
if echo "$BODY" | grep -q '"isLastMinute":true'; then
  echo -e "       ${GREEN}✓${RESET} isLastMinute=true found (events within 14 days)"
else
  echo -e "       ${YELLOW}⚠${RESET}  isLastMinute=true not detected — check daysUntilDepart calc"
fi

STATUS=$(http GET "/v1/matching/opportunities?mode=LOCAL&lat=51.51&lng=-0.12" "$GUEST_TOKEN")
BODY=$(resp)
assert "D2 Guest LOCAL ≤3 results (→ 200)" "200" "$STATUS" "$BODY" '"opportunities":'
COUNT=$(echo "$BODY" | grep -o '"id":' | wc -l | tr -d ' ')
if [[ "$COUNT" -le 3 ]]; then
  echo -e "       ${GREEN}✓${RESET} $COUNT results (within GUEST cap of 3)"
else
  echo -e "       ${RED}✗${RESET}  $COUNT results — exceeds GUEST cap of 3"
  FAIL=$((FAIL + 1)); FAILURES="$FAILURES\n  ✗ D2 GUEST cap exceeded ($COUNT > 3)"
fi

# ── E. LONG_DISTANCE MATCHING QUALITY ────────────────────────────────────────
echo ""
echo "─── E. Long-Distance Matching Quality ─────────────────────"

STATUS=$(http GET "/v1/matching/opportunities?mode=LONG_DISTANCE" "$PREMIUM_TOKEN")
BODY=$(resp)
assert "E1 LONG_DISTANCE opportunities (→ 200)" "200" "$STATUS" "$BODY" '"opportunities":'

if echo "$BODY" | grep -q '"destinationCode":"ES"'; then
  echo -e "       ${GREEN}✓${RESET} PREFERRED destination ES (Spain) present"
else
  echo -e "       ${RED}✗${RESET}  ES missing — PREFERRED boost not working"
  FAIL=$((FAIL + 1)); FAILURES="$FAILURES\n  ✗ E1 ES (PREFERRED) absent from results"
fi

if echo "$BODY" | grep -q '"destinationCode":"IT"'; then
  echo -e "       ${GREEN}✓${RESET} PREFERRED destination IT (Italy) present"
else
  echo -e "       ${YELLOW}⚠${RESET}  IT missing — may be below score threshold"
fi

if echo "$BODY" | grep -qE '"destinationCode":"JP"|"destinationCode":"TH"'; then
  echo -e "       ${GREEN}✓${RESET} DREAM destination JP or TH present"
else
  echo -e "       ${YELLOW}⚠${RESET}  JP/TH absent — check DREAM boost in scoring engine"
fi

if echo "$BODY" | grep -q '"destinationCode":"RU"'; then
  echo -e "       ${RED}✗${RESET}  EXCLUDED destination RU found — suppression broken"
  FAIL=$((FAIL + 1)); FAILURES="$FAILURES\n  ✗ E3 RU (EXCLUDED) present in results"
else
  echo -e "       ${GREEN}✓${RESET} EXCLUDED destination RU absent"
fi

if echo "$BODY" | grep -q '"type":"PRICE_DROP_MATCH"'; then
  echo -e "       ${GREEN}✓${RESET} PRICE_DROP_MATCH opportunity present"
else
  echo -e "       ${YELLOW}⚠${RESET}  PRICE_DROP_MATCH absent — check triggeredAt window (48h)"
fi

# ── F. MANUAL NIGHTLY RUNNER ──────────────────────────────────────────────────
echo ""
echo "─── F. Manual Nightly Runner ───────────────────────────────"

STATUS=$(http POST "/v1/matching/dev/run-nightly" "$PREMIUM_TOKEN")
BODY=$(resp)
assert "F1 Nightly trigger (→ 200)" "200" "$STATUS" "$BODY" '"nightly_opportunity_eval"'

if [[ -n "${DATABASE_URL:-}" ]]; then
  NOTIF_COUNT=$(db_query "SELECT COUNT(*) FROM notifications WHERE type='OPPORTUNITY_MATCH' AND \"userId\" IN (SELECT id FROM users WHERE email='premium@vst-staging.test');")
  if [[ "${NOTIF_COUNT:-0}" -gt 0 ]]; then
    echo -e "       ${GREEN}✓${RESET} $NOTIF_COUNT OPPORTUNITY_MATCH notification(s) in DB for premium user"
  else
    echo -e "       ${YELLOW}⚠${RESET}  0 OPPORTUNITY_MATCH rows — score may be below 70 threshold"
    echo "         Run: SELECT * FROM notifications WHERE \"userId\" IN (SELECT id FROM users WHERE email='premium@vst-staging.test');"
  fi

  # Dedup check: re-run and count should not increase
  PRE_COUNT=$(db_query "SELECT COUNT(*) FROM notifications WHERE type='OPPORTUNITY_MATCH' AND \"userId\" IN (SELECT id FROM users WHERE email='premium@vst-staging.test');")
  http POST "/v1/matching/dev/run-nightly" "$PREMIUM_TOKEN" > /dev/null
  POST_COUNT=$(db_query "SELECT COUNT(*) FROM notifications WHERE type='OPPORTUNITY_MATCH' AND \"userId\" IN (SELECT id FROM users WHERE email='premium@vst-staging.test');")
  if [[ "$PRE_COUNT" == "$POST_COUNT" ]]; then
    echo -e "       ${GREEN}✓${RESET} F3 Dedup working — count stable at $PRE_COUNT after re-run"
  else
    echo -e "       ${RED}✗${RESET}  F3 Dedup failed — count rose from $PRE_COUNT to $POST_COUNT"
    FAIL=$((FAIL + 1)); FAILURES="$FAILURES\n  ✗ F3 Nightly dedup broken"
  fi
else
  echo "       SKIP F2/F3 — DATABASE_URL not set"
fi

# ── G. MANUAL RADAR RUNNER ────────────────────────────────────────────────────
echo ""
echo "─── G. Manual Radar Runner ─────────────────────────────────"

STATUS=$(http POST "/v1/matching/dev/run-radar" "$PREMIUM_TOKEN")
BODY=$(resp)
assert "G1 Radar trigger (→ 200)" "200" "$STATUS" "$BODY" '"weekly_travel_radar"'

if [[ -n "${DATABASE_URL:-}" ]]; then
  RADAR_COUNT=$(db_query "SELECT COUNT(*) FROM notifications WHERE type='TRAVEL_RADAR' AND \"userId\" IN (SELECT id FROM users WHERE email='premium@vst-staging.test');")
  if [[ "${RADAR_COUNT:-0}" -gt 0 ]]; then
    echo -e "       ${GREEN}✓${RESET} $RADAR_COUNT TRAVEL_RADAR notification(s) in DB for premium user"
  else
    echo -e "       ${RED}✗${RESET}  0 TRAVEL_RADAR rows for premium user — check travelRadarAlerts + membership filter"
    FAIL=$((FAIL + 1)); FAILURES="$FAILURES\n  ✗ G2 No TRAVEL_RADAR notification for premium"
  fi

  GUEST_RADAR=$(db_query "SELECT COUNT(*) FROM notifications WHERE type='TRAVEL_RADAR' AND \"userId\" IN (SELECT id FROM users WHERE email='guest@vst-staging.test');")
  if [[ "${GUEST_RADAR:-0}" -eq 0 ]]; then
    echo -e "       ${GREEN}✓${RESET} G3 Zero TRAVEL_RADAR rows for guest (correctly excluded)"
  else
    echo -e "       ${RED}✗${RESET}  G3 Guest received TRAVEL_RADAR — PREMIUM filter broken"
    FAIL=$((FAIL + 1)); FAILURES="$FAILURES\n  ✗ G3 Guest received TRAVEL_RADAR notification"
  fi
else
  echo "       SKIP G2/G3 — DATABASE_URL not set"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo " Results: ${GREEN}${PASS} passed${RESET}  ${RED}${FAIL} failed${RESET}"
if [[ $FAIL -gt 0 ]]; then
  echo -e " Failures:${FAILURES}"
fi
echo "═══════════════════════════════════════════════════════════"
echo ""

[[ $FAIL -eq 0 ]] && exit 0 || exit 1
