

## Fix Stash Valuation: Use `chaosMedian`, Compute Evaluation Client-Side, Render Affix Fallbacks & Day Series

### Problem
1. `mergeValuationIntoItems` ignores `chaosMedian` — the actual price field from the API
2. `priceEvaluation` from the backend is unreliable — must compute it client-side based on listed vs median price delta percentage
3. When only `affixFallbackMedians` exist (no `chaosMedian`), should show affix list in tooltip but NOT show evaluation coloring
4. `daySeries` per-item history is never rendered in the tooltip
5. `PoeItem` type lacks `chaosMedian`, `daySeries`, and `affixFallbackMedians` fields

### Rules for evaluation (computed in frontend)
- Compare `listedPrice` vs `chaosMedian` (mapped to `estimatedPrice`)
- If no `chaosMedian` → no evaluation (even if `affixFallbackMedians` exist)
- Within 10% delta → `well_priced` (green)
- Within 20% delta → `could_be_better` (yellow)
- Beyond 20% → `mispriced` (red)

### Plan

#### 1. Extend `PoeItem` type (`src/types/api.ts`)
- Add `chaosMedian?: number | null`, `daySeries?: StashScanValuationDaySeries[]`, `affixFallbackMedians?: StashScanValuationAffixFallback[]`

#### 2. Fix merge + add client-side evaluation (`src/components/tabs/StashViewerTab.tsx`)
- In `mergeValuationIntoItems`: read `match.chaosMedian` or `match.chaos_median` → set as `estimatedPrice`
- Copy `daySeries` and `affixFallbackMedians` onto matched items
- Add helper `computeEvaluation(listedPrice, estimatedPrice)`: computes delta %, returns evaluation string or undefined
- Call `computeEvaluation` during merge to set `priceEvaluation` — ignore backend's evaluation entirely
- If `chaosMedian` is null/0 but `affixFallbackMedians` exist, set `estimatedPrice` to 0, `priceEvaluation` to undefined (manual check)

#### 3. Update tooltip (`src/components/stash/ItemTooltip.tsx`)
- Replace "Estimated" label with "Median"
- When `item.affixFallbackMedians` has entries and no `estimatedPrice`, render a list: each affix name + its `chaosMedian`
- When `item.daySeries` has ≥2 points, render inline `PriceSparkline`
- Only show evaluation label when `priceEvaluation` is set (which only happens when `chaosMedian` existed)

#### 4. Cell overlay stays mostly the same (`StashItemCell.tsx`)
- Already guards on `hasPrice = estimatedPrice > 0` — will naturally hide badges for affix-only items
- `hasEval` already checks `hasPrice && !!priceEvaluation` — no change needed

### Files to change

| File | Change |
|------|--------|
| `src/types/api.ts` | Add 3 fields to `PoeItem` |
| `src/components/tabs/StashViewerTab.tsx` | Fix merge to use `chaosMedian`, add `computeEvaluation`, copy `daySeries`/`affixFallbackMedians` |
| `src/components/stash/ItemTooltip.tsx` | Render affix fallbacks list, inline sparkline, rename label to "Median" |

