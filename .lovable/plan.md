

## Role-Based Access Control

### Roles & Tab Visibility

| Tab | Public | Member | Admin |
|-----|--------|--------|-------|
| ML Price | Yes | Yes | Yes |
| Opportunities | - | Yes | Yes |
| Analytics | - | Yes | Yes |
| Stash Viewer | - | Yes | Yes |
| Dashboard | - | - | Yes |
| Services | - | - | Yes |
| Messages | - | - | Yes |

### Database Changes

1. **Create `user_roles` table** using the recommended enum pattern:
   - `app_role` enum: `'admin'`, `'member'`
   - Table with `user_id` + `role`, unique constraint, RLS enabled
   - `has_role()` security definer function
   - RLS policy: authenticated users can read their own role; admins can manage all

2. **Keep `approved_users` table as-is** — approval still gates access for logged-in users. Users without a role row default to `member` once approved.

### Auth Context Changes (`src/services/auth.tsx`)

- Add `userRole: 'public' | 'member' | 'admin'` to `AuthContextValue`
- After approval check, query `user_roles` for the user's role (default to `'member'` if no row)
- Unauthenticated users get role `'public'`

### App Gate Changes (`src/App.tsx`)

- **Public (not authenticated)**: Instead of showing `<Login />`, show a read-only `Index` with only the ML Price tab visible. Add a small "Sign In" button in the header.
- **Authenticated + approved**: Show `Index` with tabs filtered by role.
- Remove the hard block on unauthenticated users; the gate now routes to a public-facing view.

### Index Page Changes (`src/pages/Index.tsx`)

- Accept `userRole` from auth context
- Define a tab visibility map and conditionally render only permitted `TabsTrigger` + `TabsContent` entries
- Default tab = `'pricecheck'` for public, `'opportunities'` for member, `'dashboard'` for admin

### API Proxy Changes (`supabase/functions/api-proxy/index.ts`)

- ML Price endpoint (`/api/v1/ops/ml/*` or `/api/v1/price-check/*`) must be accessible without auth for public users
- Add a allowlist check: if `x-proxy-path` matches the ML price endpoints, skip JWT + approval validation
- All other endpoints remain gated

### Files to Change
1. **Migration SQL** — create enum, `user_roles` table, `has_role()` function, RLS policies
2. `src/services/auth.tsx` — add `userRole` state, fetch role after approval
3. `src/App.tsx` — allow public users through to a limited Index view
4. `src/pages/Index.tsx` — filter tabs by role, adjust default tab
5. `src/components/UserMenu.tsx` — show "Sign In" button for public users instead of hiding
6. `supabase/functions/api-proxy/index.ts` — allowlist ML price endpoints for unauthenticated access

