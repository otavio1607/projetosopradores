-- Create maintenance_records table to persist user-specific maintenance date changes
create table if not exists public.maintenance_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  equipment_tag text not null,
  type_id text not null,
  ultima_manutencao date,
  proxima_manutencao date,
  updated_at timestamptz not null default now(),
  unique(user_id, equipment_tag, type_id)
);

-- Enable Row Level Security
alter table public.maintenance_records enable row level security;

-- Policies: each user can only access their own records
create policy "Users can view their own maintenance records"
  on public.maintenance_records for select
  using (auth.uid() = user_id);

create policy "Users can insert their own maintenance records"
  on public.maintenance_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own maintenance records"
  on public.maintenance_records for update
  using (auth.uid() = user_id);

create policy "Users can delete their own maintenance records"
  on public.maintenance_records for delete
  using (auth.uid() = user_id);
