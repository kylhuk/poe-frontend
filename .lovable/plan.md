

## Sync Frontend with Updated Backend + Persist POESESSID

### Summary of Changes Found

**Price Check (`/price-check`)** — Backend now forwards trust metadata AND new fields:
- `fairValueP50`, `fastSale24hPrice`, `mlPredicted`, `predictionSource`, `estimateTrust`, `estimateWarning` are all present in the price-check response now (previously missing, which motivated the dual-call strategy)
- The dual-call approach in `PriceCheckTab.tsx` is no longer needed — a single `priceCheck` call returns everything except shadow/rollout data

**Shadow Comparison shape changed** — Backend now returns:
```
{ candidateModelVersion, incumbentModelVersion, candidate: { route, price_p50, ... }, incumbent: { route, price_p50, ... } }
```
Frontend expects: `{ candidatePrediction, incumbentPrediction, deltaPercent }` — this is broken.

**ML Analytics status** — `map_status_payload` now includes `route_decisions` array (frontend drops it).

**Automation History** — Now includes `mode` ("v3"/"v2"), `modelMetrics`, `modelHistory`, `routeFamilies` arrays (frontend drops them all).

**Rollout Controls** — Backend added `rollbackToIncumbent` as a writable field.

**POESESSID persistence** — Currently stored only as a backend cookie. Needs a database table so signed-in users don't have to re-enter it.

---

### Plan

#### 1. Create `user_poe_sessions` table (database migration)
- Columns: `id uuid PK`, `user_id uuid NOT NULL UNIQUE`, `encrypted_session text NOT NULL`, `account_name text`, `updated_at timestamptz DEFAULT now()`
- RLS: users can only read/update/insert/delete their own row (`user_id = auth.uid()`)
- On login with POESESSID, save to this table. On page load, restore from table and send to backend.

#### 2. Update types (`src/types/api.ts`)
- Add `fairValueP50`, `fastSale24hPrice` to `PriceCheckResponse`
- Rework `ShadowComparison` to match new nested shape: `candidate: { route, price_p50, ... }`, `incumbent: { ... }` plus model versions
- Add `mode` to `MlAutomationHistory`
- Add `modelMetrics`, `modelHistory`, `routeFamilies` to `MlAutomationHistory`
- Add `routeDecisions` to `MlStatus` interface in api.ts

#### 3. Fix API normalizers (`src/services/api.ts`)
- `normalizePriceCheckResponse`: extract `fairValueP50`, `fastSale24hPrice`, and all trust fields (now present in response)
- `normalizeMlPredictOneResponse`: fix `shadowComparison` normalization to match new nested shape (compute `deltaPercent` from `candidate.price_p50` and `incumbent.price_p50`)
- `normalizeMlAnalytics`: extract `route_decisions` array
- `normalizeMlAutomationHistory`: extract `mode`, `modelMetrics`, `modelHistory`, `routeFamilies`
- `normalizeRolloutControls` / `updateRolloutControls`: support `rollbackToIncumbent`

#### 4. Simplify PriceCheckTab (`src/components/tabs/PriceCheckTab.tsx`)
- Remove dual-call strategy — single `api.priceCheck()` call now returns trust metadata
- Keep `api.mlPredictOne()` only for shadow/rollout data (optional secondary call)
- Display `fairValueP50` and `fastSale24hPrice` as secondary metrics
- Fix `ShadowComparisonCard` to render new nested shape (show route, p50, confidence for each side)

#### 5. Enhance AnalyticsTab ML panels (`src/components/tabs/AnalyticsTab.tsx`)
- Show `route_decisions` in MlPanel when non-empty
- Show `modelMetrics` table in MlAutomationPanel (per-route model performance)
- Show `routeFamilies` as grouped breakdown
- Show `mode` badge (v2/v3) in automation status header
- Add `rollbackToIncumbent` toggle to RolloutCard

#### 6. Persist POESESSID (`src/services/auth.tsx`, `src/components/UserMenu.tsx`)
- On successful `login(poeSessionId)`: save the POESESSID + accountName to `user_poe_sessions` via Supabase client
- On auth init (when supabase user is authenticated and approved): check `user_poe_sessions` for existing session, if found, automatically call `login()` with the stored value
- On `logout()`: delete the row from `user_poe_sessions`
- Update `UserMenu` to show "Session saved" indicator when persisted

### Files to edit
1. **Database migration** — create `user_poe_sessions` table with RLS
2. `src/types/api.ts` — expand types
3. `src/services/api.ts` — fix normalizers
4. `src/components/tabs/PriceCheckTab.tsx` — simplify to single call, add new fields, fix shadow card
5. `src/components/tabs/AnalyticsTab.tsx` — new panels for modelMetrics, routeFamilies, routeDecisions, mode badge, rollback toggle
6. `src/services/auth.tsx` — persist/restore POESESSID from database
7. `src/components/UserMenu.tsx` — minor: show saved session indicator

