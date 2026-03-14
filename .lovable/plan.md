

## Code Review Findings

### Issues Found

**1. `RenderState` missing `forwardRef` (console error)**
The console shows: "Function components cannot be given refs." `RenderState` is used inside Radix UI components (via `CardContent`) that attempt to pass refs. Fix: wrap with `React.forwardRef`.

**2. `API_BASE` duplication and potential mismatch**
Both `src/services/api.ts` and `src/services/auth.tsx` independently read `VITE_API_BASE_URL`. If the env var isn't set, auth endpoints resolve to empty string (relative paths), which won't work for the popup OAuth flow since the callback page needs an absolute URL. Should extract `API_BASE` to a shared constant or ensure both files stay in sync. The backend URL `https://api.poe.lama-lan.ch` should be the fallback.

**3. Network errors: "Failed to fetch"**
All API requests are failing. The `Authorization` header uses the `VITE_API_KEY` but auth also relies on cookie-based sessions (`credentials: 'include'`). The backend needs to allow CORS from the Lovable preview origin. This is a backend-side fix, but the frontend should handle these failures gracefully (it partially does via error states).

### Plan

1. **Fix `RenderState`** — wrap with `forwardRef` to eliminate the console error.
2. **Extract shared API base** — create a small `src/services/config.ts` exporting `API_BASE` so both `api.ts` and `auth.tsx` use the same value with the correct fallback to `https://api.poe.lama-lan.ch`.

