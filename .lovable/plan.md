

## Spec Alignment + Build Error Fix

### Problems Found

**Build errors:**
1. `MergedPriceResult` is undefined — should be `PriceCheckResponse` (PriceCheckTab.tsx:290)
2. `.map` on `unknown` in api.ts — the `??` expressions resolve to `unknown`, need explicit `as unknown[]` casts (6 occurrences)

**Spec deviations:**

| Area | Current | Spec says |
|------|---------|-----------|
| `PriceCheckResponse` | Has `searchDiagnostics`, `comparablesSummary`, `valueDrivers`, `scenarioPrices`, `shadowComparison` | None of these fields exist |
| `MlPredictOneResponse` | Has `searchDiagnostics`, `comparablesSummary`, `valueDrivers`, `scenarioPrices`, `servingModelVersion`, `shadowComparison` | None of these fields exist |
| `MlAutomationStatus` | Missing `trainerRuntime` | Has optional `trainerRuntime: { stage, status, updatedAt, details }` |
| `MlAutomationHistory` | Missing `charts` | Has `charts: { mdapeHistory[], coverageHistory[] }` |

### Plan

#### 1. Fix `src/types/api.ts`

- **Remove** from `PriceCheckResponse`: `searchDiagnostics`, `comparablesSummary`, `valueDrivers`, `scenarioPrices`, `shadowComparison` fields
- **Remove** from `MlPredictOneResponse`: `searchDiagnostics`, `comparablesSummary`, `valueDrivers`, `scenarioPrices`, `servingModelVersion`, `shadowComparison` fields
- **Remove** the now-orphaned interfaces: `SearchDiagnostics`, `ComparablesSummary`, `ValueDrivers`, `ScenarioPrices`, `ShadowComparison`, `ShadowComparisonSide`
- **Add** `trainerRuntime` to `MlAutomationStatus`: `trainerRuntime?: { stage: string | null; status: string | null; updatedAt: string | null; details: Record<string, unknown> } | null`
- **Add** `charts` to `MlAutomationHistory`: `charts?: { mdapeHistory: Record<string, unknown>[]; coverageHistory: Record<string, unknown>[] }`

#### 2. Fix `src/services/api.ts`

- **Remove** all `searchDiagnostics`, `comparablesSummary`, `valueDrivers`, `scenarioPrices`, `shadowComparison` normalization from `normalizePriceCheckResponse`
- **Remove** same fields + `servingModelVersion` from `normalizeMlPredictOneResponse`
- **Fix** 6 `.map` on `unknown` errors by adding explicit `as unknown[]` casts on the `??` expressions (lines 532, 549, 554, 607, 624, 629)
- **Add** `trainerRuntime` normalization to `normalizeMlAutomationStatus`
- **Add** `charts` normalization to `normalizeMlAutomationHistory`

#### 3. Fix `src/components/tabs/PriceCheckTab.tsx`

- **Change** `MergedPriceResult['comparables']` → `PriceCheckResponse['comparables']` (line 290)
- **Remove** the `ShadowComparisonCard` component and its usage (lines 207, 240-288)
- **Remove** value drivers display (lines 209-219)
- **Remove** search diagnostics display (lines 221-225)
- **Remove** scenario prices display (lines 227-231)
- **Remove** `ShadowComparison` import and `GitCompare` icon import

#### 4. Update `src/components/tabs/AnalyticsTab.tsx` — ML panel cleanup

- **Add** trainer runtime display in the Automation Status card (show stage, status, updatedAt when `trainerRuntime` is present)
- **Ensure** no empty panels render — all conditional sections already guard with `length > 0` or null checks; verify route metrics, promotions, dataset coverage, and charts sections only show when populated

### Files to edit
1. `src/types/api.ts` — Remove 6 interfaces, strip non-spec fields, add `trainerRuntime` and `charts`
2. `src/services/api.ts` — Strip normalizer code, fix TS errors, add new normalizations
3. `src/components/tabs/PriceCheckTab.tsx` — Remove shadow/diagnostics/drivers/scenarios UI, fix type reference
4. `src/components/tabs/AnalyticsTab.tsx` — Add trainer runtime card, ensure no empty visuals

