-- CostPilot AI — Supabase schema
-- Run in Supabase SQL editor or via supabase db push

create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  company_name text,
  stripe_customer_id text,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  estimates_limit int not null default 2,
  estimates_used_this_period int not null default 0,
  period_start timestamptz not null default date_trunc('month', now()),
  period_end timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  unique(user_id)
);

create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  project_type text not null default 'residential',
  country text not null default 'US',
  state text not null,
  city text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists blueprints (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  page_count int default 1,
  file_size_bytes bigint not null,
  uploaded_at timestamptz default now()
);

create table if not exists estimates (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  status text not null default 'draft',
  total_cost numeric(12,2) default 0,
  currency text default 'USD',
  assumptions jsonb default '{}',
  category_totals jsonb default '{}',
  report_storage_path text,
  created_at timestamptz default now()
);

create table if not exists estimate_line_items (
  id uuid primary key default uuid_generate_v4(),
  estimate_id uuid not null references estimates(id) on delete cascade,
  category text not null,
  description text not null,
  quantity numeric(12,2) not null,
  unit text not null,
  unit_cost numeric(12,2) not null,
  labor_cost numeric(12,2) not null,
  material_cost numeric(12,2) not null,
  total_cost numeric(12,2) not null,
  confidence numeric(3,2) default 0.5,
  sort_order int default 0
);

create table if not exists analysis_jobs (
  id uuid primary key default uuid_generate_v4(),
  blueprint_id uuid not null references blueprints(id) on delete cascade,
  estimate_id uuid not null references estimates(id) on delete cascade,
  status text not null default 'pending',
  error_message text,
  ai_extraction_raw jsonb,
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists beta_signups (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  company_name text,
  role text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table projects enable row level security;
alter table blueprints enable row level security;
alter table estimates enable row level security;
alter table estimate_line_items enable row level security;
alter table analysis_jobs enable row level security;

create policy "Users manage own profile" on profiles
  for all using (auth.uid() = id);

create policy "Users manage own subscription" on subscriptions
  for all using (auth.uid() = user_id);

create policy "Users manage own projects" on projects
  for all using (auth.uid() = user_id);

create policy "Users manage own estimates via project" on estimates
  for all using (
    exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- Storage bucket: blueprints (create in Supabase dashboard)
-- insert into storage.buckets (id, name, public) values ('blueprints', 'blueprints', false);
