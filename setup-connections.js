// Setup script for connections table
// Run this in your Supabase SQL editor

console.log('Setting up connections table...');

// Copy and paste this SQL into your Supabase SQL editor:

const sql = `
-- Connections table to track connection requests and payment status
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid references auth.users(id) on delete cascade,
  user_b_id uuid references auth.users(id) on delete cascade,
  user_a_connected boolean default false,
  user_b_connected boolean default false,
  user_a_paid boolean default false,
  user_b_paid boolean default false,
  user_a_payment_intent_id text,
  user_b_payment_intent_id text,
  status text default 'pending', -- 'pending', 'both_connected', 'both_paid', 'completed'
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_a_id, user_b_id)
);

-- Index for faster lookups
create index if not exists idx_connections_user_a on public.connections(user_a_id);
create index if not exists idx_connections_user_b on public.connections(user_b_id);
create index if not exists idx_connections_status on public.connections(status);

-- Enable RLS
alter table public.connections enable row level security;

-- Policies for connections table
drop policy if exists "Users can view their own connections" on public.connections;
create policy "Users can view their own connections"
on public.connections
for select
using (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "Users can insert their own connections" on public.connections;
create policy "Users can insert their own connections"
on public.connections
for insert
with check (auth.uid() = user_a_id);

drop policy if exists "Users can update their own connections" on public.connections;
create policy "Users can update their own connections"
on public.connections
for update
using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- Function to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
drop trigger if exists update_connections_updated_at on public.connections;
create trigger update_connections_updated_at
  before update on public.connections
  for each row
  execute function update_updated_at_column();
`;

console.log('SQL to run in Supabase:');
console.log(sql);
console.log('\nInstructions:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run" to execute');
console.log('5. Verify the connections table was created'); 