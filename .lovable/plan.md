
## Findings

I checked the live logs and the frontend is hitting the stash endpoints:

- `/api/v1/stash/status` returns `connected_populated`, `tabCount: 19`, `itemCount: 796`
- `/api/v1/stash/tabs?...&tabIndex=N` is being requested and returns a large payload (~968 KB)
- `/api/v1/stash/scan/status` is currently stuck at `running` with `0/19 tabs` and `0/0 items`

So the app is getting stash data, but the scan-status endpoint is misleading right now. Also, the logged `/stash/tabs` responses still appear to return the same stash object (`index: 0`, name `X2`) even for different `tabIndex` values, so the frontend should stop pretending tab switching worked when the backend returned a different tab.

## Plan

### 1. Make the Stash UI resilient to stale scan status
Update `src/components/tabs/StashViewerTab.tsx` so scan progress is treated as secondary information, not as the source of truth for whether stash data exists.

- Keep showing the last successfully loaded stash tab even while scan status says `running`
- If stash data exists, replace the scary `0/19 · 0/0` presentation with softer copy like “Scan running — showing last available stash data”
- If status says connected and there is no loaded tab yet, retry loading the current tab instead of only trying once on first mount

### 2. Track the tab the backend actually returned
Update the stash types and normalizer so the frontend keeps the real returned stash index from `/api/v1/stash/tabs`.

- Extend the normalized stash tab model with returned tab index
- In `loadTab(tabIndex)`, compare requested tab vs returned tab
- If they differ, show a clear inline warning that the backend returned a different tab than requested

This prevents the UI from silently showing the first tab while the user thinks another tab is selected.

### 3. Tighten the `/stash/tabs` normalization
Update `src/services/api.ts` to normalize the raw tabs payload more defensively.

- Preserve all `tabs[]` metadata
- Preserve `stash.index`
- Continue mapping PoE stash types correctly
- Make the response handling robust even when scan metadata is null or missing

### 4. Add regression tests for the real failure mode
Update stash tests so this does not regress again.

Add tests for:
- status says scan is running with `0/19` and `0/0`, but previously loaded stash items still render
- connected stash with no loaded tab triggers a retry load
- backend returns tab index `0` for requested tab `N`, and the UI shows a mismatch warning instead of silently switching

## Files to update

- `src/components/tabs/StashViewerTab.tsx`
- `src/services/api.ts`
- `src/types/api.ts`
- `src/components/tabs/StashViewerTab.test.tsx`

## Technical note

This plan improves the frontend behavior and makes the real backend state visible. It does not “fix” the backend if `/stash/tabs?tabIndex=N` is still returning stash index `0` for every request; instead, it makes that mismatch explicit in the UI so there are no hidden visualization bugs anymore.
