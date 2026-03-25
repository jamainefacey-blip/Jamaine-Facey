Run full validation suite and report PASS or BLOCKED.

Steps to execute:
1. Run: pnpm build:vst (Next.js production build)
2. If build fails — report BLOCKED with exact error
3. If build passes — start server and check all VST routes return HTTP 200:
   / /how-it-works /business-travel /pricing /compliance /demo /login /signup
4. Run: pnpm preview:ai-lab and confirm AI Lab panel responds at port 4444
5. Report results in this format:

BUILD: PASS | BLOCKED
ROUTES: list each with HTTP status
AI_LAB: PASS | BLOCKED
STATUS: PASS | BLOCKED
