## Fix Stash Viewer — Remove All In-Cell Text Clutter

### Problem

Every item cell renders the item name and price as tiny overlaid text directly in the cell. This makes the grid completely unreadable. In-game PoE stash tabs show **only the item icon** in cells — all text info appears in the hover tooltip.

### Changes

#### 1. `src/components/stash/StashItemCell.tsx`

- **Remove the fallback name text entirely** from the cell — the `displayName` span that shows "Majestic Plate", "Dragonbone Rapier" etc. should never render inside the cell, even for normal tabs. If there's no icon, show an empty dark cell (the tooltip handles identification).
- **Remove the price tag** (`estimatedPrice`) from inside the cell entirely. Price info belongs in the tooltip only.
- **Keep stack size badge** — this is the only text that belongs in-cell (matches in-game behavior).
- **Keep evaluation background tint** — the subtle green/yellow/red tint is fine as a non-text visual cue.

#### 2. No other files need changes

The grid layout, CSS, and tooltip already work correctly. The only problem is the text spam inside cells.

### Result

Cells will show: icon + optional stack size badge + subtle eval tint. Nothing else. All detailed info (name, price, stats) appears on hover via the existing `ItemTooltip`.  
  
  
YOU FUCKING IDIOT SHALL NOT DRAW A GRID IF IT IS NOT A GRID!!!! THE FUCKING GRID HAS TO BE SYMMETRICAL AND GOD FUCKING DAMMIT JUST CHECK YOURSELF WITH SCREENSHOTS IF IT LOOKS GOOD OR NOT!!!!