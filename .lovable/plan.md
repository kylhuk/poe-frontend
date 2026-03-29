

## Re-create debug_traffic Table with Auto-Pruning + Viewer Tab

Re-create the `debug_traffic` table (previously dropped), add a trigger to cap it at 1000 rows, create a reader edge function, and add a UI tab to browse the logs.

### Changes

**1. Database migration**
- Re-create `debug_traffic` table (same schema as before)
- Add a trigger function that deletes oldest rows when count exceeds 1000, fired after each INSERT
- RLS: service_role only (edge functions write with service role key)

```sql
CREATE TABLE public.debug_traffic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  method text NOT NULL,
  path text NOT NULL,
  request_headers jsonb,
  request_body text,
  response_status int,
  response_headers jsonb,
  response_body text
);

ALTER TABLE public.debug_traffic ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.debug_traffic
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-prune to 1000 rows
CREATE OR REPLACE FUNCTION public.prune_debug_traffic()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.debug_traffic
  WHERE id NOT IN (
    SELECT id FROM public.debug_traffic
    ORDER BY created_at DESC LIMIT 1000
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_prune_debug_traffic
  AFTER INSERT ON public.debug_traffic
  FOR EACH STATEMENT EXECUTE FUNCTION public.prune_debug_traffic();
```

**2. Edge function — `supabase/functions/debug-traffic-reader/index.ts`**
- Re-create the reader function that queries `debug_traffic` ordered by `created_at DESC`, with a `limit` query param (default 100, max 1000)
- Uses service role key to bypass RLS

**3. Frontend tab — `src/components/tabs/DebugTrafficTab.tsx`**
- Table showing: timestamp, method, path, response status, request/response body (expandable)
- Auto-refresh button + manual refresh
- Sorted newest-first
- Fetches from the debug-traffic-reader edge function

**4. Index page — `src/pages/Index.tsx`**
- Add "API Traffic" tab visible to `admin` role only
- Import DebugTrafficTab and add to tab list

### Files affected
- New migration SQL (via migration tool)
- `supabase/functions/debug-traffic-reader/index.ts` — create
- `src/components/tabs/DebugTrafficTab.tsx` — create
- `src/pages/Index.tsx` — add tab entry

