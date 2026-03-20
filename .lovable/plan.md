

## Visualize All Available Backend Data

### What's missing

After reviewing the backend source code, three significant data sets are being returned by the API but completely ignored by the frontend:

### 1. Gold Diagnostics (Diagnostics tab)
The backend's `analytics_report` endpoint already returns a `goldDiagnostics` object containing per-mart health data:
- Summary: status, martCount, problemMarts, goldEmptyMarts, staleMarts, missingLeagueMarts
- Per-mart rows: martName, diagnosticState, sourceRowCount, goldRowCount, freshness, lag, league visibility

The Diagnostics tab currently shows "feature_unavailable". This data is already being fetched by the Reports panel but thrown away.

**Plan**: Create a dedicated `getAnalyticsReport` response type that includes `goldDiagnostics`. Either share the data from the existing report call, or add a direct fetch. Build a Diagnostics panel with:
- Summary cards (mart count, problem count, stale count, missing league count)
- Status badge (ok / stale / league_gap / degraded / gold_empty)
- Table of marts with columns: Name, State, Source Rows, Gold Rows, Freshness (min), Lag (min), League Visibility

### 2. ML Rollout Controls
The backend exposes `GET /api/v1/ml/leagues/{league}/rollout` and `PUT` for updates. The response includes:
- shadowMode, cutoverEnabled, candidateModelVersion, incumbentModelVersion
- effectiveServingModelVersion, updatedAt, lastAction

**Plan**: Add a Rollout card inside the ML panel showing the current rollout state. Display:
- Shadow mode on/off
- Cutover enabled on/off
- Candidate vs Incumbent model versions
- Effective serving model version
- Last action and update time
- Toggle controls for shadow mode and cutover (PUT to update)

### 3. Report Gold Diagnostics rendering
The ReportsPanel already fetches `analytics_report` which includes `goldDiagnostics`, but doesn't render it.

**Plan**: Add a Gold Diagnostics section to the Reports panel, or share data with the Diagnostics tab.

### Files to modify

1. **`src/services/api.ts`**
   - Add `ReportAnalyticsWithDiagnostics` type (or expand existing `ReportAnalytics`)
   - Add `getGoldDiagnostics()` function (or extract from report response)
   - Add `getRolloutControls()` and `updateRolloutControls()` functions
   - Add rollout types

2. **`src/types/api.ts`**
   - Add `GoldDiagnosticsMart`, `GoldDiagnosticsSummary`, `GoldDiagnosticsResponse` types
   - Add `RolloutControls` type

3. **`src/components/tabs/AnalyticsTab.tsx`**
   - Replace Diagnostics tab placeholder with a real `DiagnosticsPanel` showing gold mart health
   - Add Rollout Controls card to MlPanel
   - Optionally add gold diagnostics summary to ReportsPanel

### Technical details

- Gold diagnostics data shape (from backend `analytics_gold_diagnostics`):
```text
{
  league, 
  summary: { status, martCount, problemMarts, goldEmptyMarts, staleMarts, missingLeagueMarts },
  marts: [{ martName, sourceName, diagnosticState, sourceRowCount, goldRowCount, 
            sourceLatestAt, goldLatestAt, goldFreshnessMinutes, sourceToGoldLagMinutes,
            leagueVisibility, sourceLeagueRows, goldLeagueRows, ... }]
}
```

- Rollout controls data shape (from backend `_rollout_payload`):
```text
{
  league, shadowMode, cutoverEnabled, candidateModelVersion, incumbentModelVersion,
  effectiveServingModelVersion, updatedAt, lastAction
}
```

- The report endpoint already includes `goldDiagnostics` in its response, so the Diagnostics tab can reuse that data or fetch report and extract it, avoiding an extra API call.

