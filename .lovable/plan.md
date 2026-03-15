

## Fix: Add Visible Feedback to POESESSID Login Flow

### Problem
`handleSave` in `UserMenu.tsx` always runs `setValue(''); setOpen(false);` after `await login()`, even if login failed. Errors are only logged to the hidden API error panel. The user gets zero feedback.

### Changes

**`src/services/auth.tsx`** — Make `login()` return success/failure:
- Change return type to `Promise<boolean>`
- Return `true` if `refreshSession` results in `connected`, `false` otherwise
- If the POST response is not ok, still continue to refreshSession but track the failure

**`src/components/UserMenu.tsx`** — Add toast feedback and conditional popover close:
- Import `useToast` (or `toast` from sonner)
- In `handleSave`: if `login()` returns false, show an error toast ("Login failed — check your POESESSID") and do NOT close the popover or clear the input
- If login succeeds, show a success toast ("Connected as {name}") and close the popover
- Add a loading state on the Save button during the async call

### Files
1. `src/services/auth.tsx` — `login` returns `Promise<boolean>`
2. `src/components/UserMenu.tsx` — toast feedback, conditional close, loading spinner

