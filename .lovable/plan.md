

# PoE Trading Dashboard

A dark, PoE-themed dashboard for managing Python services, monitoring analytics modules, and executing trades — all with mock data and clear API contracts for future backend integration.

## Design & Theme
- Dark background with PoE-inspired colors: deep blacks/charcoals, muted gold accents, red for warnings, green for opportunities
- Data-dense cards that each answer: what is it, why is it good, how fast will it move, what do I do
- Freshness timestamps and confidence indicators on every data card — nothing presented as real-time
- Top tab navigation: **Dashboard** | **Services** | **Analytics** | **Price Check** | **Stash Viewer** | **Messages**

## Tab 1: Dashboard (Overview)
- Summary cards: active services count, pending alerts, top opportunity (by net chaos/min of human time)
- Quick-glance service health row with colored status dots
- Top 3 ranked opportunities across all modules, sorted by expected net chaos per minute

## Tab 2: Services
- Table/card list of all services (crawlers, Docker containers, analytics engines)
- Each service shows: name, status (running/stopped/error), uptime, last data crawl timestamp, rows in DB, container info
- **Start / Stop / Restart** buttons per service
- Bulk actions (start all, stop all)

## Tab 3: Analytics Modules
Sub-tabs or scrollable cards for each module:
- **FairValueEngine** — Market card with item name, fair value, floor, exchange mid, sparkline, spread, liquidity, confidence
- **StaleListingArb** — Ranked opportunity inbox with discount %, dormancy, margin, sale time, route
- **GemValueModel** — Gem detail card with normalized state, anomaly score, comparable cluster
- **HeistRouter** — Four-bin routing panel (sell fast / premium / run / ignore)
- **ShipmentOptimizer** — Single recommended shipment card with EV breakdown
- **GoldShadowPrice** — Compact banner with chaos-per-gold, fee, denomination hint
- **SessionController** — Single recommendation card with trigger reason
- **GearSwapSimulator** — Input current gear + candidate item, shows post-swap stats with red/green fail/pass states

## Tab 4: Price Check
- Text input area to paste item text
- Submit button sends to API stub
- Results card showing: predicted value, probability/confidence, comparable items

## Tab 5: Stash Viewer
- Grid layout mimicking PoE stash tab (12×12 grid for normal tabs)
- Items rendered as colored cells with icons/names
- Price overlay on each item (estimated value, listed price, delta)
- Color coding: green = well priced, yellow = could be better, red = significantly mispriced
- Mock stash data provided, API contract defined for real data

## Tab 6: Messages
- Filterable table of alerts and opportunities from the backend
- Columns: timestamp, type/severity, source module, message, suggested action
- Color-coded severity (info/warning/critical)
- Filter by module, severity, time range
- Mock messages pre-populated

## API Contracts
All data fetched through a centralized API service layer with TypeScript interfaces. Each endpoint returns typed mock data, making it trivial to swap in real backend calls later. Interfaces documented inline for: service status, each analytics module response, price check request/response, stash tab data, and message feed.

