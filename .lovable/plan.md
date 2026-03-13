

# Stash Viewer: Background Coloring, Visible Names & API JSON Schema

## 1. Cell Background Coloring
Replace the tiny health dots with full cell background tints:
- `good` → faint green tint (`hsl(140,60%,15%,0.3)`)
- `ok` → faint yellow tint (`hsl(35,80%,15%,0.3)`)  
- `bad` → faint red tint (`hsl(0,60%,15%,0.4)`)

Remove the dot element entirely. Update legend to use colored squares instead of dots.

## 2. Visible Item Name
Show the item name as a small text label inside each cell (below the icon). For quad tabs, use a very small font size (`text-[6px]`) with truncation. For normal tabs, use `text-[8px]`. This lets users scan without hovering.

## 3. API JSON Schema Display
Add a collapsible section below the stash grid showing the expected JSON structure as a formatted code block with a "Copy" button. The schema will reflect the fields you listed:

```json
{
  "stashTabs": [
    {
      "id": "string",
      "name": "string",
      "type": "normal | quad | currency | map",
      "items": [
        {
          "id": "string",
          "name": "string",
          "x": 0,
          "y": 0,
          "w": 1,
          "h": 1,
          "itemClass": "Currency | Gem | Weapon | ...",
          "rarity": "normal | magic | rare | unique",
          "listedPrice": 100,
          "estimatedPrice": 120,
          "estimatedPriceConfidence": 85,
          "priceDeltaChaos": 20,
          "priceDeltaPercent": 20.0,
          "priceEvaluation": "well_priced | could_be_better | mispriced"
        }
      ]
    }
  ]
}
```

## 4. Update Types & Mock Data
- Update `StashItem` interface to add `estimatedPriceConfidence`, `priceDeltaChaos`, `priceDeltaPercent` fields (currently computed on the fly — make them explicit from the API)
- Rename `estimatedValue` → `estimatedPrice`, `priceHealth` → `priceEvaluation` to match the schema
- Update mock data accordingly

## Files Modified
- `src/types/api.ts` — update `StashItem` interface
- `src/services/mockData.ts` — update mock data fields
- `src/components/tabs/StashViewerTab.tsx` — background coloring, visible names, JSON schema display section

