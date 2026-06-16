-- Mirrors the SQLite/Turso zip_data schema (see scripts/seed-turso.ts) in Postgres.
-- Public reference data: readable by anyone, written only by the service role.

create table if not exists public.zip_data (
  zip                    text primary key,
  state                  text,
  median_income          integer,
  home_age               integer,
  owner_occupancy        double precision,
  median_property_value  integer,
  pct_10yr_owners        double precision,
  population             integer,
  pct_children           double precision,
  pct_degree             double precision,
  avg_commute            double precision,
  pct_mgmt               double precision,
  criteria_1             text,
  criteria_2             text,
  criteria_3             text,
  criteria_4             text,
  criteria_5             text,
  full_criteria          text,
  cr_copy_income         text,
  cr_copy_stability      text,
  cr_copy_occupancy      text,
  cr_copy_demo           text,
  cr_copy_family         text
);

create index if not exists idx_zip_data_state on public.zip_data (state);
create index if not exists idx_zip_data_full_criteria on public.zip_data (full_criteria);
-- text_pattern_ops lets the search query (zip LIKE 'NNN%') use the index.
create index if not exists idx_zip_data_zip_prefix on public.zip_data (zip text_pattern_ops);

alter table public.zip_data enable row level security;

-- Anyone may read reference data. Writes go through the service role, which
-- bypasses RLS, so no insert/update policy is defined.
drop policy if exists "zip_data public read" on public.zip_data;
create policy "zip_data public read"
  on public.zip_data
  for select
  to anon, authenticated
  using (true);
