

## Sync Frontend with API Spec

After comparing the OpenAPI spec against the current codebase, here are the discrepancies and the plan to fix them.

### Findings

**1. Messages endpoint response shape**
- Spec: `OpsMessagesResponse` is a plain JSON array (not wrapped)
- Code: `api.getMessages()` unwraps `payload.messages`
- Fix: Handle both shapes — try `payload.messages` first, fall back to treating payload as array directly

**2. Stash scan start uses deprecated alias**
- Spec: `/api/v1/stash/scan/start` (POST, 202) is the canonical endpoint; `/api/v1/stash/scan` is deprecated
- Code: `startStashScan()` calls `/api/v1/stash/scan`
- Fix: Switch to `/api/v1/stash/scan/start`

**3. Analytics subtabs beyond spec**
- Spec `AnalyticsKind` enum: `ingestion, scanner, opportunities, search-suggestions, search-history, pricing-outliers`
- Code has extra subtabs: **alerts**, **backtests**, **ml**, **reports**, **session**, **diagnostics**
- ML automation has its own dedicated endpoints in the spec (`/api/v1/ml/leagues/{league}/automation/*`), so the ML panel is valid — it just uses different routes, not the analytics dispatcher
- `alerts`, `backtests`, `reports`, `diagnostics` hit `/api/v1/ops/analytics/{kind}` with kinds NOT in the spec
- Fix: Remove the four non-spec analytics subtabs (alerts, backtests, reports, diagnostics). Keep ML panel (uses dedicated ML endpoints). Keep session as-is (already shows "not supported").

**4. Pricing outliers: `max_buy_in` not in spec**
- Spec params: `league, limit, min_total, sort, order, query`
- Code sends `max_buy_in` as a query param
- Fix: Remove `max_buy_in` / `maxBuyIn` from the request builder and types

**5. StashScanValuationsRequest missing `stashId`**
- Spec: request body includes optional `stashId`
- Code: type and request builder don't include it
- Fix: Add `stashId?: string` to the type and send it when present

### Files to change

| File | Change |
|------|--------|
| `src/services/api.ts` | Fix messages response parsing, switch scan/start path, remove `max_buy_in` from outliers, add `stashId` to valuations body, remove `getAnalyticsAlerts`, `getAnalyticsBacktests`, `getAnalyticsReport` functions |
| `src/types/api.ts` | Remove `maxBuyIn` from `PricingOutliersQuery`/`PricingOutliersRequest`/`PricingOutliersQueryPayload`, add `stashId` to `StashScanValuationsRequest` |
| `src/components/tabs/AnalyticsTab.tsx` | Remove Alerts, Backtests, Reports, Diagnostics subtabs and their panel components. Remove related imports |

### Not changing (spec inconsistencies)
- Stash endpoints reference `League` as `in: path` but paths don't contain `{league}` — this is a spec bug. Current query-param usage is correct.

