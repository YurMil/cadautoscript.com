-- Security advisor cleanup (issue #109).
--
-- 1. Drop public.community_posts: abandoned draft — zero rows, zero code
--    references, never part of the migration history, and RLS was enabled
--    with no policies so no client could access it anyway.
drop table if exists public.community_posts;

-- 2. Document that anonymous access to get_utility_popularity() is
--    intentional: it returns only site-wide aggregates (utility_id, total
--    launches) used for smart sorting of the public catalog, and exposes no
--    per-user data. This addresses the
--    anon_security_definer_function_executable advisor WARN.
comment on function public.get_utility_popularity() is
  'Intentionally callable by anon: returns only site-wide launch aggregates for public catalog sorting; no per-user data (see issue #109).';
