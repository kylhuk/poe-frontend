

## Update ML Price Check and Analytics to Match Current Backend

### Findings

After reviewing the latest backend code pushed to GitHub, here is what actually differs from what the frontend handles:

**Price Check (`/api/v1/ops/leagues/{league}/price-check`)**:
- The backend `price_check_payload` does NOT forward `mlPredicted`, `predictionSource`, `estimateTrust`, `estimateWarning` from the ML prediction — only `fallbackReason` is passed. The frontend normalizer handles these fields but they arrive as `undefined`.
- `fairValueP50` and `fastSale24hPrice` are NOT present in the backend output.
- The trust fields (`mlPredicted`, etc.) only exist on the `/predict-one` endpoint's `normalize_predict_one_payload`.

**ML Analytics (`/api/v1/ops/analytics/ml`)**:
- `map_status_payload` now includes `warmup` (already handled by frontend) and `promotion_policy` (already handled).
- `latest_avg_mdape` and `latest_avg_interval_coverage` are present (already handled).
- No `route_decisions` field exists — only `route_hotspots` (already handled).

**Automation History (`/automation/history`)**:
- Backend output matches current frontend normalizer exactly. No new arrays (`modelMetrics`, `modelHistory`, `routeFamilies`).

**Predict-one (`/predict-one`)**:
- Returns `rollout` and `servingModelVersion` and optionally `shadowComparison` for the Mirage league — frontend does NOT display these.

### Plan

Given the actual backend state, the meaningful changes are:

#### 1. Price Check: use dual-call strategy to get trust fields
Since `price_check_payload` doesn't include trust metadata but `predict-one` does, make PriceCheckTab call **both** endpoints: `priceCheck` for comparables + `mlPredictOne` for trust fields, then merge results. This ensures `mlPredicted`, `predictionSource`, `estimateTrust`, `estimateWarning`, `route`, and `league` are available.

**File**: `src/components/tabs/PriceCheckTab.tsx`
- Call both `api.priceCheck()` and `api.mlPredictOne()` in parallel
- Merge trust fields from predict-one into the price-check result for display
- Keep existing trust indicator UI (amber banners, dimmed values, etc.)

#### 2. Display rollout/shadow data for predict-one
The predict-one endpoint returns `rollout` and `shadowComparison` for Mirage league. Surface this in the Price Check result card.

**File**: `src/types/api.ts`
- Add `rollout` and `shadowComparison` optional fields to `MlPredictOneResponse`
- Add `servingModelVersion` field

**File**: `src/services/api.ts`
- Extend `normalizeMlPredictOneResponse` to extract `rollout`, `servingModelVersion`, `shadowComparison`

**File**: `src/components/tabs/PriceCheckTab.tsx`
- When `shadowComparison` is present, show a small comparison card (candidate vs incumbent prediction)
- Show `servingModelVersion` as a metadata chip

#### 3. No changes needed for Analytics ML tab
The backend output matches the existing frontend implementation. All fields are already normalized and displayed.

### Files to edit
1. `src/types/api.ts` — add rollout/shadow types to `MlPredictOneResponse`
2. `src/services/api.ts` — extend predict-one normalizer for rollout/shadow fields
3. `src/components/tabs/PriceCheckTab.tsx` — dual-call strategy, merge trust fields, show rollout/shadow data

