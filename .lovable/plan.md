

## Overhaul Stash Viewer for Real PoE Stash Data

### What We're Building
A faithful recreation of Path of Exile's stash tab viewer that renders real API data using official PoE CDN icons (`web.poecdn.com`), supporting all tab types with their native layout systems.

---

### Data Shapes from PoE API (from HAR analysis)

**Tab types identified:**
- **Normal**: `{ items: [...] }` — 12x12 grid, items have `x, y, w, h`
- **Quad**: `{ quadLayout: true, items: [...] }` — 24x24 grid
- **Currency**: `{ currencyLayout: { sections: [...], layout: { "0": {x, y, w, h, scale, section, hidden?}, ... } }, items: [...] }` — absolute positioning, items matched by `x` field to slot index
- **Fragment**: `{ fragmentLayout: { sections: [...], layout: { "0,0": {x, y, ...}, ... } }, items: [...] }` — same absolute system, keys are `"slot,0"`
- **Other special** (delirium, essence, map, blight, ultimatum, divination, unique): same absolute layout pattern with their own `*Layout` key

**Item shape:**
```
icon: "https://web.poecdn.com/gen/image/..."
stackSize, maxStackSize, name, typeLine, baseType
frameType: 0=Normal, 1=Magic, 2=Rare, 3=Unique, 4=Gem, 5=Currency
x, y, w, h, ilvl, identified, corrupted
properties: [{ name, values: [[val, colorCode]], displayMode, type }]
explicitMods: string[], implicitMods: string[]
requirements: [{ name, values, displayMode, type }]
sockets: [{ group, attr, sColour: "R"|"G"|"B"|"W" }]
descrText, flavourText
```

---

### Plan

#### 1. Expand Types (`src/types/api.ts`)

Add raw PoE item and layout types:
- `PoeItem` interface matching the full PoE API item shape (icon, stackSize, frameType, properties, mods, sockets, corrupted, etc.)
- `SpecialLayout` type: `{ sections: string[]; layout: Record<string, { x: number; y: number; w: number; h: number; scale: number; section?: string; hidden?: boolean }> }`
- Expand `StashTab` to include optional layout fields: `quadLayout?: boolean`, `currencyLayout?: SpecialLayout`, `fragmentLayout?: SpecialLayout`, `deliriumLayout?: SpecialLayout`, `essenceLayout?: SpecialLayout`, `mapLayout?: SpecialLayout`, etc.
- Expand `StashTab.type` union to cover all types
- Keep existing `StashItem` (with pricing overlay) as optional enrichment on top of `PoeItem`

#### 2. Rewrite `StashViewerTab.tsx` — Split Into Sub-Components

**Rendering strategy by tab type:**

- **`NormalGrid` / `QuadGrid`**: CSS grid (12x12 or 24x24). Items placed via `gridColumn`/`gridRow` spans. Each cell renders an `<img>` of the official icon. Multi-slot items (2x2 boots, 2x4 weapons) span correctly.

- **`SpecialLayoutGrid`**: For currency/fragment/delirium/etc tabs. Uses a `position: relative` container (aspect-ratio: 1, max-width 695px). Each slot from the layout map renders as `position: absolute` with `left`/`top` in pixels (normalized to container width ~569px from the layout coords). Items matched to slots by their `x` field (slot index). Hidden slots (`hidden: true`) are skipped. Section tabs (general/influence/league) as sub-navigation within the tab.

- **`StashItemCell`**: Shared item renderer:
  - `<img src={item.icon}>` with rarity-colored border glow based on `frameType`
  - Stack size badge (top-right, white text on dark bg, like in-game)
  - Price evaluation tint overlay when pricing data available (from backend enrichment)
  - Hover triggers `ItemTooltip`

- **`ItemTooltip`**: PoE-style tooltip on hover (using HoverCard):
  - Rarity-colored header bar (grey/blue/yellow/brown based on frameType)
  - Item name + typeLine
  - Properties section (damage, armour, etc.)
  - Separator line, then implicit mods (lighter color)
  - Explicit mods (blue text)
  - Requirements line
  - Socket display (colored circles: R=red, G=green, B=blue, W=white, linked by lines for same group)
  - "Unidentified" / "Corrupted" red text
  - Price evaluation section when enriched

#### 3. Update CSS (`src/index.css`)

- `.poe-tooltip` — dark bg, gold border, PoE-style tooltip layout
- `.poe-tooltip-header-normal/magic/rare/unique/gem/currency` — rarity header bars
- `.stash-special-layout` — relative container for absolute-positioned slots
- `.stash-special-slot` — absolute positioned item slot
- Rarity border glow classes for item icons
- Socket display styles (colored circles with link lines)
- Stack size badge positioning

#### 4. Update API Normalizer (`src/services/api.ts`)

- `getStashTabs` normalizer: detect tab type from response keys (`quadLayout`, `currencyLayout`, `fragmentLayout`, etc.)
- Pass through raw `PoeItem` data including `icon`, `frameType`, `sockets`, `properties`, `mods`
- Map `frameType` number to rarity string for backward compat
- Pass through layout objects for special tabs

#### 5. Mock Data (`src/services/mockData.ts`)

- Add realistic mock stash data with a few items per tab type
- Use real `web.poecdn.com` icon URLs from the HAR data
- Include a currency tab mock with layout slots
- Include a quad tab mock with multi-slot items (weapons, armour)

---

### Files to Create/Edit

1. `src/types/api.ts` — add PoeItem, SpecialLayout, expand StashTab
2. `src/components/tabs/StashViewerTab.tsx` — full rewrite with NormalGrid, SpecialLayoutGrid, StashItemCell, ItemTooltip
3. `src/index.css` — PoE tooltip styles, special layout CSS, socket display
4. `src/services/api.ts` — stash normalizer updates
5. `src/services/mockData.ts` — realistic mock data with real icon URLs

