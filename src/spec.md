# Specification

## Summary
**Goal:** Make Version 16 fully live and usable on the production (Internet Computer mainnet) URL.

**Planned changes:**
- Deploy/upgrade the backend and frontend canisters to Internet Computer mainnet for Version 16 production go-live.
- Run and confirm the production verification checklist in `frontend/PRODUCTION_STABILIZATION.md` after deployment (unauthenticated load and post-login startup behavior).
- If deployment fails or requires retries, document the exact deploy command, full deploy output/error logs (as applicable), and final backend/frontend canister IDs in `frontend/PRODUCTION_DEPLOYMENT_LOGS.md`.

**User-visible outcome:** The app is reachable on the production URL, shows the Auth page promptly for logged-out users, and transitions to the correct dashboard after login without prolonged loading screens or unexpected production console errors.
