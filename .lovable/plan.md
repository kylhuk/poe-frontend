

## Add Lovable Cloud Login Gate

### What changes

Add a minimal email/password login screen using the Lovable Cloud (Supabase) auth system. The entire app is blocked behind this gate. The existing PoE-specific auth (POESESSID / OAuth) remains untouched inside the app — this is a separate access-control layer.

### Database

- Enable auto-confirm for email signups (small user base, no email verification needed)
- No profiles table needed — we only need to know if the user is authenticated

### Files

**1. `src/services/auth.tsx`** — Add Supabase session layer
- Import `supabase` client
- Add `supabaseUser` state (from `supabase.auth.getSession()` + `onAuthStateChange`)
- Add `signIn(email, password)`, `signUp(email, password)`, `signOut()` methods
- Expose `supabaseUser` and `isAuthenticated` (boolean) on context
- Keep all existing PoE auth (`login`, `logout`, `refreshSession`, `sessionState`) unchanged

**2. New `src/pages/Login.tsx`** — Minimal login page
- Two fields: email, password
- Toggle between "Sign In" and "Sign Up" modes
- Uses `signIn` / `signUp` from auth context
- Matches existing dark theme (bg-background, card-game styling)
- Toast feedback on errors

**3. `src/App.tsx`** — Gate the app
- Read `isAuthenticated` and `isLoading` from auth context
- If not authenticated, render `<Login />` instead of the router
- Keep toasters and providers outside the gate so toasts work on the login page

**4. `src/components/UserMenu.tsx`** — Add "Sign Out" option
- Add a sign-out button (from Lovable Cloud auth) at the bottom of the popover
- Show the logged-in email somewhere minimal

### Flow
1. User opens app → sees login screen
2. First time: toggle to "Sign Up", enter email + password → account created, auto-confirmed, logged in
3. Returning: enter email + password → logged in
4. Inside the app: existing PoE POESESSID / OAuth flow works as before
5. Sign out from UserMenu → back to login screen

### Auth config
- Auto-confirm email signups (user explicitly requested no verification)
- No 2FA

