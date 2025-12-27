-- Enable pg_trgm for semantic similarity
create extension if not exists pg_trgm with schema public;

-- Update profiles table
alter table public.profiles 
  add column if not exists birth_date date,
  add column if not exists is_onboarding_complete boolean default false;

-- Update bonds table
alter table public.bonds 
  add column if not exists dynamic text,
  add column if not exists is_onboarding_complete boolean default false;

-- Create daily_dew_prompts table (Global Pool)
create table if not exists public.daily_dew_prompts (
  id uuid not null default uuid_generate_v4(),
  question_text text not null,
  dynamic text[], -- Array of strings for dynamics e.g. ['Situationship', 'Married']
  min_age integer default 0,
  created_at timestamp with time zone default now(),
  constraint daily_dew_prompts_pkey primary key (id),
  constraint daily_dew_prompts_question_text_key unique (question_text)
);

-- Modify game_prompts table (Global Pool)
alter table public.game_prompts 
  add column if not exists dynamic text[],
  add column if not exists min_age integer default 0;

-- Ensure unique constraint on (game_type_id, prompt_text) for game_prompts
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'game_prompts_game_type_id_prompt_text_key') then
        alter table public.game_prompts add constraint game_prompts_game_type_id_prompt_text_key unique (game_type_id, prompt_text);
    end if;
end $$;

-- Add Trigram Index for Semantic Search on game_prompts
create index if not exists trgm_idx_game_prompts_prompt_text on public.game_prompts using gin (prompt_text gin_trgm_ops);

-- Create bond_seen_prompts table (Tracking History)
create table if not exists public.bond_seen_prompts (
  id uuid not null default uuid_generate_v4(),
  bond_id uuid not null,
  prompt_id uuid not null, -- Can reference game_prompts.id or daily_dew_prompts.id
  type text not null check (type in ('game', 'dew')),
  seen_at timestamp with time zone default now(),
  constraint bond_seen_prompts_pkey primary key (id),
  constraint bond_seen_prompts_bond_id_fkey foreign key (bond_id) references public.bonds(id) on delete cascade
);

-- Add index for fast filtering of seen prompts
create index if not exists idx_bond_seen_prompts_bond_type on public.bond_seen_prompts (bond_id, type);

-- Add RLS Policies for new tables

-- daily_dew_prompts: Read-only for authenticated users
alter table public.daily_dew_prompts enable row level security;
create policy "Authenticated users can read daily_dew_prompts" on public.daily_dew_prompts for select using (auth.role() = 'authenticated');

-- bond_seen_prompts: Users can read/insert for their own bonds
alter table public.bond_seen_prompts enable row level security;
create policy "Users can read/insert tracking for their bonds" on public.bond_seen_prompts for all using (
  auth.uid() in (
    select user_1_id from public.bonds where id = bond_id
    union
    select user_2_id from public.bonds where id = bond_id
  )
);
