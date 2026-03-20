

## Fix ML Analytics Data Visualization

### Problem
The `/ops/analytics/ml` endpoint response is cast directly to `MlAnalytics` without normalization. The backend sends fields like `promotion_policy` and `warmup` that the frontend silently drops. Route hotspots are rendered as raw JSON.

### Backend Response Shape (confirmed from source)
The `map_status_payload` in the backend returns:
```text
{
  "status": {
    league, run, status, promotion_verdict, promotion_policy,
    stop_reason, active_model_version, latest_avg_mdape,
    latest_avg_interval_coverage, candidate_vs_incumbent,
    route_hotspots, warmup
  }
}
```

- `promotion_policy`: dict with gate thresholds (e.g. mdape floor, coverage floor)
- `warmup`: dict with warmup state info (present when status is `no_runs`)
- `route_hotspots`: array of objects with route-level anomaly data
- `candidate_vs_incumbent`: dict with comparison metrics

### Changes

#### 1. Update `MlStatus` type and add normalizer (`src/services/api.ts`)
- Add `promotion_policy` and `warmup` optional fields to `MlStatus`
- Add a `normalizeMlAnalytics()` function that properly maps the response, handling both snake_case and camelCase for all fields
- Wire `getAnalyticsMl()` to use the normalizer instead of raw cast

#### 2. Render new fields in ML panel (`src/components/tabs/AnalyticsTab.tsx`)
- **Promotion Policy**: Show gate thresholds (MDAPE ceiling, coverage floor, etc.) as a small summary card when present
- **Warmup**: Show warmup state when status is `no_runs` instead of just "No ML data"
- **Route Hotspots**: Replace `JSON.stringify` dump with a structured table showing route, metric values, and anomaly indicators — falling back to formatted JSON only for truly unknown shapes

#### 3. Harden candidate_vs_incumbent rendering
- Guard against null/undefined numeric fields (the backend can return empty dict `{}` when status is `no_runs`)
- Prevent `.toFixed()` crashes on undefined values

### Files
1. `src/services/api.ts` — add `normalizeMlAnalytics`, expand `MlStatus` type
2. `src/components/tabs/AnalyticsTab.tsx` — render promotion_policy, warmup, structured hotspots

