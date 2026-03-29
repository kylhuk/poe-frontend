

## Add Stash Scan Valuations (Two-Phase Scan)

The scan process becomes two phases: (1) item retrieval scan (existing), then (2) valuation scan via the new `POST /api/v1/stash/scan/valuations` endpoint. After the item scan publishes, the frontend automatically triggers valuations and polls until complete.

### Changes

**1. Types — `src/types/api.ts`**
- Add `StashScanValuationsRequest` interface with fields: `scanId`, `minThreshold`, `maxThreshold`, `maxAgeDays`, optional `itemId`, `structuredMode`
- Add `StashScanValuationsResponse` interface with fields: `structuredMode`, `stashId`, `itemId?`, `scanDatetime?`, `chaosMedian?`, `daySeries?`, `affixFallbackMedians?`, `items`
- Add `startStashValuations(req: StashScanValuationsRequest): Promise<StashScanValuationsResponse>` to `ApiService` interface

**2. API service — `src/services/api.ts`**
- Add `startStashValuations()` method that POSTs to `/api/v1/stash/scan/valuations` with league/realm query params and the request body

**3. API proxy — `supabase/functions/api-proxy/index.ts`**
- The `/api/v1/stash/` allowlist already covers this route — no change needed

**4. StashViewerTab — `src/components/tabs/StashViewerTab.tsx`**
- After item scan reaches `published` status, automatically call `api.startStashValuations({ scanId, minThreshold: 0, maxThreshold: 99999, maxAgeDays: 7 })` using the published scan ID
- Add a `valuationPhase` state: `'idle' | 'running' | 'done' | 'failed'`
- Show two-phase progress in the scan status area: "Phase 1: Scanning items…" → "Phase 2: Valuating items…" → done
- Store valuation response for potential use (item price overlays already exist via `PriceEvaluation`)
- The "Scan" button triggers the full pipeline; disable it during either phase

### Files affected
- `src/types/api.ts` — add request/response types, update ApiService
- `src/services/api.ts` — add `startStashValuations` method
- `src/components/tabs/StashViewerTab.tsx` — two-phase scan flow with UI feedback

