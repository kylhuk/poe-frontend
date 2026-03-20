

## Adjust ML Price Check Tab

### What changes

The backend now returns additional fields on both endpoints that the frontend drops: `mlPredicted`, `predictionSource`, `estimateTrust`, `estimateWarning`, `league`, `route`. The `mlPredictOne` call still uses the legacy request format. The `priceCheck` call does no normalization. The UI doesn't distinguish ML vs static-fallback results.

### 1. Update types (`src/types/api.ts`)

Add new fields to both response types:

- `MlPredictOneResponse`: add `league`, `route`, `mlPredicted`, `predictionSource`, `estimateTrust`, `estimateWarning`
- `PriceCheckResponse`: add `mlPredicted`, `predictionSource`, `estimateTrust`, `estimateWarning`
- Change `MlPredictOneRequest` to use `itemText` instead of `clipboard`

### 2. Fix API layer (`src/services/api.ts`)

- **`mlPredictOne()`**: Switch from legacy `input_format`/`payload`/`output_mode` body to `{ itemText: text }`. Update normalizer to extract the new fields (`mlPredicted`, `predictionSource`, `estimateTrust`, `estimateWarning`, `league`, `route`) handling both snake_case and camelCase.
- **`priceCheck()`**: Add normalization (currently raw cast). Extract same new fields plus `comparables`. Send `{ itemText: text.trim() }`.
- **Error handling**: Parse error envelope `{ error: { code, message } }` in `request()` to surface `backend_unavailable` and `league_not_allowed` as specific error messages.

### 3. Rework PriceCheckTab UI (`src/components/tabs/PriceCheckTab.tsx`)

- Call `priceCheck` (single call gives prediction + comparables).
- **Trust indicators**:
  - When `mlPredicted === false` or `estimateTrust === 'low'`: render an amber warning banner with `estimateWarning` text, dim the prediction value styling.
  - When `priceRecommendationEligible === false`: show a muted "Not eligible for price recommendation" notice.
  - When `fallbackReason` is non-empty: show as a warning badge (already partially done, make more prominent).
- **New data display**:
  - Show `predictionSource` and `route` as small metadata chips below the prediction value.
  - Show `league` in the header area.
- **Error states**:
  - `backend_unavailable`: "Model not available — try again later" with a distinct icon.
  - `league_not_allowed`: "This league is not supported for price checking."
  - Generic errors: keep current behavior.
- Add a helper `isLowTrustEstimate(result)` that checks `mlPredicted === false || estimateTrust === 'low' || fallbackReason non-empty`.

### Files
1. `src/types/api.ts` — expand `PriceCheckResponse`, `MlPredictOneResponse`, `MlPredictOneRequest`
2. `src/services/api.ts` — fix request body format, add normalization for new fields, improve error parsing
3. `src/components/tabs/PriceCheckTab.tsx` — trust indicators, new field display, error states

