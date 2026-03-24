

## Revamp Outliers into a Standalone "Opportunities" Style View

### Current State
The pricing outliers API already returns exactly the data you need: per-item grouping with median, P10, P90, entry price, expected profit, ROI, underpriced rate, and weekly too-cheap counts. The current UI is a basic table buried in the Analytics sub-tabs with poor visual hierarchy.

### Plan
Create a new standalone **Flip Finder** page (or replace the current Outliers sub-tab content) with a poe.ninja-inspired dense, sortable, filterable view focused on actionability.

### Changes

#### 1. New component: `src/components/tabs/FlipFinderTab.tsx`

**Layout — three sections:**

- **Top filter bar**: Search input, league, max buy-in slider, min sample size slider, sort dropdown, order toggle. Compact single row.
- **Summary cards row**: 3-4 KPI cards showing: total opportunities found, best ROI item, highest profit item, average underpriced rate. Derived client-side from the response rows.
- **Main table**: Dense, sortable, color-coded opportunity table.

**Table design (poe.ninja-inspired):**
- Columns: Item Name, Entry Price, Fair Value (median), Spread (P90-P10), Expected Profit, ROI%, Underpriced Rate%, Volume/Week, Sample Size
- ROI column: green/yellow/red color coding (>100% green, 50-100% yellow, <50% red)
- Underpriced Rate: progress bar visual inside the cell
- Entry Price: highlighted in gold as the "action" column
- Row click: expands to show P10/P90 range bar, affix details, analysis level
- Sortable by clicking column headers (client-side re-sort of the already-fetched data)
- Sticky header

**Weekly trend chart**: Small sparkline-style bar chart at the top showing too-cheap counts per week (already in `weekly[]` response)

**Behavior:**
- Debounced API call on filter change (already implemented pattern)
- Client-side column sorting after data arrives (no re-fetch needed)
- Expandable rows for detail (no dialog needed)

#### 2. Register as top-level tab in `src/pages/Index.tsx`

- Replace the existing "Opportunities" tab content with this new FlipFinderTab
- Keep the same route `/opportunities` and icon
- Visible to `member` and `admin`

#### 3. Keep existing Outliers sub-tab in Analytics

- The Analytics > Outliers sub-tab stays as-is for admin-level raw data view
- The new FlipFinder tab is the user-facing, actionable version

#### 4. Styles in `src/index.css`

- `.flip-row`: compact 36px rows with hover highlight
- `.roi-badge`: color-coded ROI indicator
- `.underpriced-bar`: inline progress bar for underpriced rate
- `.spread-bar`: visual P10-P90 range indicator

### Files
- `src/components/tabs/FlipFinderTab.tsx` — new
- `src/pages/Index.tsx` — wire up as Opportunities tab content
- `src/index.css` — add flip-finder styles

### Technical notes
- No new API calls — reuses existing `getAnalyticsPricingOutliers()` 
- Client-side sorting avoids redundant API calls when user clicks column headers
- Filter changes still trigger the API (backend does the heavy computation)
- Summary KPIs computed from response rows client-side

