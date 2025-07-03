create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text,
  phone text,
  openness integer,
  conscientiousness integer,
  extraversion integer,
  agreeableness integer,
  neuroticism integer,
  availability text,
  availability_flexibility text,
  chronotype text,
  communication text,
  conflict_style text,
  motivations text[],
  top_motivation text,
  exit_scenario text,
  roles text[],
  preferred_role text,
  team_style text,
  cofounder_frustration text,
  cofounderPreference text,         -- camelCase (if your code uses this)
  personality text,
  work_style text,
  motivation text,
  cofounder_preference text,        -- snake_case (if your code uses this)
  startup_stage text,
  avatar text,
  age integer,
  industries text[],
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone
);

alter table public.profiles enable row level security;

create policy "Allow select for authenticated users"
on public.profiles
for select
using (auth.uid() = id);

create policy "Allow insert for authenticated users"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Allow update for authenticated users"
on public.profiles
for update
using (auth.uid() = id); 