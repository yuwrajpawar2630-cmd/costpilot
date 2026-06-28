-- Drop dependent tables first to avoid foreign key conflicts
drop table if exists estimate_line_items;
drop table if exists analysis_jobs;
drop table if exists estimates;

-- Create the new estimates table
create table if not exists estimates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  project_name text not null,
  project_type text not null,
  blueprint_url text not null,
  extracted_json jsonb default '{}',
  material_breakdown jsonb default '[]',
  labor_breakdown jsonb default '[]',
  total_cost numeric(12,2) not null,
  confidence numeric(3,2) not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table estimates enable row level security;

-- Policy for estimates access
create policy "Users manage own estimates" on estimates
  for all using (auth.uid() = user_id);
