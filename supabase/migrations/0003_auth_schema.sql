-- S1: auth schema — orgs, profiles, brands
-- set_updated_at() function already exists from 0002_leads.sql

create table if not exists orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- one profile per auth.users row; links the user to an org
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  org_id      uuid references orgs on delete set null,
  role        text not null default 'field'
                check (role in ('owner','field','marketing')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- one brand record per org; answers stored as JSONB so question schema can
-- change without a migration (Raven supplies final questions)
create table if not exists brands (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references orgs on delete cascade,
  company_name         text,
  answers              jsonb not null default '{}',
  onboarding_complete  boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create unique index if not exists brands_org_id_unique on brands (org_id);
create index if not exists profiles_org_id on profiles (org_id);

create trigger orgs_updated_at
  before update on orgs
  for each row execute function set_updated_at();

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger brands_updated_at
  before update on brands
  for each row execute function set_updated_at();

-- RLS

alter table orgs     enable row level security;
alter table profiles enable row level security;
alter table brands   enable row level security;

-- helper: returns the caller's org_id (null when unauthenticated or no profile yet)
create or replace function my_org_id()
returns uuid language sql stable security definer as $$
  select org_id from profiles where id = auth.uid()
$$;

-- orgs: members can read/update their own org
create policy "orgs_select" on orgs for select using (id = my_org_id());
create policy "orgs_update" on orgs for update using (id = my_org_id());

-- profiles: users see and update only their own row
-- insert is handled server-side (admin client) during onboarding
create policy "profiles_select" on profiles for select using (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- brands: org members can read/update; insert is server-side (admin client)
create policy "brands_select" on brands for select using (org_id = my_org_id());
create policy "brands_update" on brands for update using (org_id = my_org_id());
