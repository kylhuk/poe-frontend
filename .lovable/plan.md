

## Sync Frontend with Updated API Spec

After comparing the updated OpenAPI specification against the current codebase, here are the remaining discrepancies and fixes.

### Findings

**1. Dead code: `getAnalyticsMl()` function**
- Calls `/api/v1/ops/analytics/ml` — a route NOT in the spec's `AnalyticsKind` enum
- The ML panel already correctly uses the dedicated `/api/v1/ml/leagues/{league}/automation/*` endpoints
- Fix: Remove the `getAnalyticsMl()` function and all supporting types (`MlAnalytics`, `MlStatus`, `MlCandidateComparison`, `MlPromotionPolicy`, `MlWarmup`, `MlRouteHotspot`, and the normalization helpers)

**2. "Session" analytics subtab not in spec**
- The spec `AnalyticsKind` enum only allows: `ingestion, scanner, opportunities, search-suggestions, search-history, pricing-outliers`
- "session" is not a valid analytics kind and the tab already shows "not supported"
- Fix: Remove the Session subtab from the AnalyticsTab

**3. `StashScanValuationsResponse` missing required `scanId` field**
- Spec: `required: [structuredMode, scanId, stashId, items]`
- Code: type has `stashId` and `structuredMode` but is missing `scanId`
- Fix: Add `scanId: string` to the response type

**4. Test file references removed functions**
- `AnalyticsTab.test.tsx` still mocks `getAnalyticsMl`, `getAnalyticsAlerts`, `getAnalyticsBacktests`, `getAnalyticsReport`
- Fix: Clean up test mocks to match current API surface

### Files to change

| File | Change |
|------|--------|
| `src/services/api.ts` | Remove `getAnalyticsMl()` and its normalization helpers (`normalizeMlAnalytics`, `normalizeMlCandidateComparison`, `normalizeMlRouteHotspot`). Remove associated types (`MlAnalytics`, `MlStatus`, `MlCandidateComparison`, `MlPromotionPolicy`, `MlWarmup`, `MlRouteHotspot`) |
| `src/types/api.ts` | Add `scanId: string` to `StashScanValuationsResponse` |
| `src/components/tabs/AnalyticsTab.tsx` | Remove the Session subtab trigger and content |
| `src/components/tabs/AnalyticsTab.test.tsx` | Remove mocks for `getAnalyticsMl`, `getAnalyticsAlerts`, `getAnalyticsBacktests`, `getAnalyticsReport`. Remove any session-tab test cases |

### Not changing
- Stash endpoints continue using `league` as query param (spec marks it as path param but actual paths don't contain `{league}` — confirmed spec bug)
- ML panel stays — it uses the correct dedicated ML automation endpoints, not the analytics dispatcher

