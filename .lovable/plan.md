

## Enhance Economy Table with Price History, Stash Quantities, and Change %

### What's available from the API

| Requested feature | API support | Plan |
|---|---|---|
| Price history sparkline (7d/24h) | YES — `GET /stash/items/{fingerprint}/history` returns timestamped price entries | Lazy-load per visible page, render inline SVG sparkline |
| Price change % past 24h | YES — derive from history entries | Compute from history data |
| Number in stash (stack) | YES — `stackSize` already on `PoeItem` | Add dedicated "Qty" column |
| poe.ninja / currency exchange price | NO — no endpoint in API spec | Show "N/A" or omit; cannot implement without backend changes |
| Trading volume | NO — no endpoint in API spec | Same — not available |

### Changes

#### 1. Add `fingerprint` to `PoeItem` — `src/types/api.ts` + `src/services/api.ts`

The raw items from the backend include `fingerprint` but the normalizer drops it. Preserve it so we can call the history endpoint.

- Add `fingerprint?: string` to `PoeItem`
- In `normalizePoeItem`, map `item.fingerprint` to the output

#### 2. New sparkline component — `src/components/economy/PriceSparkline.tsx`

A tiny inline SVG sparkline (80×24px) showing price over time:
- Accepts an array of `{timestamp, value}` points
- Renders a polyline with gradient fill
- Green if trending up, red if trending down
- Shows "—" placeholder while loading

#### 3. Batch history fetcher — `src/services/stashCache.ts`

Add a function to fetch history for a batch of fingerprints:
- `fetchItemHistories(fingerprints: string[]): Promise<Map<string, HistoryEntry[]>>`
- Calls `api.getStashItemHistory(fp)` for each fingerprint sequentially (to avoid hammering the API)
- Caches results in a module-level Map so re-renders don't re-fetch
- Derives `change24h` percentage from the last two entries within 24h

#### 4. Update `EconomyTable.tsx`

Add new columns and integrate history data:

- **Qty column**: Shows `stackSize` (or 1 if not set). Sortable.
- **24h % column**: Color-coded percentage change. Green for positive, red for negative. Sortable.
- **7d Sparkline column**: Inline `PriceSparkline` component. Non-sortable.
- Remove or condense the "Eval" column to make room
- The table component accepts an optional `historyMap` prop with pre-fetched history data

#### 5. Update `EconomyTab.tsx`

- After items load, trigger history fetch for items on the current page (lazy — only fetch for the 50 visible items)
- When page changes, fetch history for the new page's items
- Pass `historyMap` down to `EconomyTable`
- Show a subtle loading indicator on sparkline cells while fetching

### New column layout

```text
# | Item | Qty | Est. Value | Listed | Δ | 24h% | 7d Chart | iLvl
```

### Files

- `src/types/api.ts` — add `fingerprint` to `PoeItem`
- `src/services/api.ts` — preserve fingerprint in normalizer
- `src/services/stashCache.ts` — add batch history fetcher + 24h change deriver
- `src/components/economy/PriceSparkline.tsx` — new inline SVG sparkline
- `src/components/economy/EconomyTable.tsx` — add Qty, 24h%, sparkline columns
- `src/components/tabs/EconomyTab.tsx` — lazy-load history per page

### Technical notes

- History is fetched lazily per page (50 items) to avoid loading 800+ histories at once
- Results are cached in-memory (module-level Map) so navigating back to a page doesn't re-fetch
- poe.ninja prices and trading volume are not available from the current backend API — these would require new backend endpoints

