

## Fix Build Errors and Enhance Frontend with Backend API

### Problems to Fix

**5 build errors across 4 files:**

1. **Merge conflict in `supabase/functions/api-proxy/index.ts`** (lines 122-132): Unresolved git conflict markers. Keep both approaches: rewrite set-cookie AND extract backend session header.

2. **Missing `publishedScanId` in `StashViewerTab.tsx`** (line 36): `EMPTY_SCAN_STATUS` is missing the required `publishedScanId: null` property.

3. **`as Response` type casts in `api.test.ts`** (lines 48, 109): Need `as unknown as Response` pattern since mock objects don't fully implement Response.

4. **`fetchMock.mock.calls` typing in `api.test.ts`** (line 176): Tuple type mismatch, need explicit cast.

5. **`.filter` on `unknown` in `api.ts`** (line 717): Cast `leagueOptions` before calling `.filter`.

### Frontend Enhancements Based on Backend API Analysis

After reviewing the full backend route registry, I found these gaps/improvements:

**A. Stash Viewer: Use auth session state to skip "Connect account" blocker**
- The `StashViewerTab` shows "Connect account" based on `stashStatus.status === 'disconnected'`, but this can fail if the status endpoint itself fails due to missing session cookie. The component should also check the `AuthContext.sessionState` to determine connectivity — if `sessionState === 'connected'`, proceed to load stash even if status returned disconnected (race condition).

**B. Add `analytics/opportunities` endpoint consumption**
- Backend exposes `/api/v1/ops/analytics/opportunities` but frontend never calls it. The `OpportunitiesTab` only uses `scanner/recommendations`. Add the analytics opportunities data to enrich the Opportunities tab with aggregate statistics.

**C. ML Rollout `POST` method support**
- Backend supports both `GET` and `POST` on `/api/v1/ml/leagues/{league}/rollout`, but frontend uses `PUT`. Change to `POST` to match backend.

**D. Scanner recommendations sort field alignment**
- Backend default sort is `expected_profit_per_operation_chaos` but frontend sends `expected_profit_chaos`. These may not match. Align the field names.

---

### Files to Edit

1. **`supabase/functions/api-proxy/index.ts`** — Resolve merge conflict (lines 122-132): keep `rewriteProxySetCookie` AND extract `x-poe-backend-session` header
2. **`src/components/tabs/StashViewerTab.tsx`** — Add `publishedScanId: null` to `EMPTY_SCAN_STATUS`; integrate `useAuth().sessionState` to prevent false "disconnected" states
3. **`src/services/api.test.ts`** — Fix 3 type cast errors with `as unknown as Response` and explicit array cast
4. **`src/services/api.ts`** — Fix `.filter` on unknown type; change rollout `PUT` to `POST` to match backend

