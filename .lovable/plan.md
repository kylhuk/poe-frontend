

## Fix: PoE OAuth Popup Not Opening

### Problem
`window.open()` is called **after** an `await authProxyFetch('/login')`. Browsers block popups that aren't triggered synchronously from a user click. By the time the fetch resolves, the user-gesture context is gone and the popup is silently blocked.

### Solution
Open a blank popup **immediately** on click (preserving the gesture context), then update its `location` once the authorize URL is fetched from the backend.

### Changes

**`src/services/auth.tsx`** — Rewrite `login()`:
1. Call `window.open('about:blank', 'poe-oauth', ...)` synchronously at the top of the function (before any `await`)
2. Then `await authProxyFetch('/login')` to get the `authorizeUrl`
3. Set `popup.location.href = authorizeUrl`
4. If the fetch fails, close the blank popup and show an error toast

This is a single-file, ~10-line change in the `login` callback.

