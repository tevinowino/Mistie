/*
  MISTIE V1.0 - INITIAL SCHEMA
  Tables, Enums, RLS, Triggers
*/

-- 1. ENUMS AND EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE relationship_status AS ENUM ('pending', 'crush', 'couple');
CREATE TYPE nug_type AS ENUM ('silent', 'note');
CREATE TYPE atmosphere_type AS ENUM ('morning', 'deep', 'aura', 'wildfire');
CREATE TYPE heat_level AS ENUM ('flicker', 'glow', 'ignite', 'molten');

-- 2. TABLES

-- Profiles (Users)
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text NOT NULL,
    avatar_url text,
    push_token text,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

-- Bonds (Relationship)
CREATE TABLE public.bonds (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_1_id uuid NOT NULL REFERENCES public.profiles(id),
    user_2_id uuid REFERENCES public.profiles(id),
    status relationship_status DEFAULT 'pending',
    streak_count int DEFAULT 0,
    best_streak int DEFAULT 0,
    garden_stage int DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

-- Relationship Anchors (Context for AI)
CREATE TABLE public.relationship_anchors (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    bond_id uuid NOT NULL REFERENCES public.bonds(id) ON DELETE CASCADE,
    creator_id uuid NOT NULL REFERENCES public.profiles(id),
    key text NOT NULL,
    value text NOT NULL,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

-- Daily Dews (Questions)
CREATE TABLE public.daily_dews (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    bond_id uuid NOT NULL REFERENCES public.bonds(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    user_1_response text,
    user_2_response text,
    is_revealed boolean DEFAULT false,
    scheduled_for date NOT NULL,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE (bond_id, scheduled_for)
);

-- Nugs (Real-time Interactions)
CREATE TABLE public.nugs (
    id bigserial PRIMARY KEY,
    bond_id uuid NOT NULL REFERENCES public.bonds(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id),
    type nug_type NOT NULL,
    content varchar(50),
    created_at timestamptz DEFAULT now()
);

-- Intimacy Maps (Game Preferences)
CREATE TABLE public.intimacy_maps (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    bond_id uuid REFERENCES public.bonds(id) ON DELETE CASCADE,
    preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);


-- 3. ROW LEVEL SECURITY (RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_dews ENABLE ROW LEVEL SECURITY;
ALTER TABLE nugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE intimacy_maps ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, partial update
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Bonds: Users see bonds they are part of
CREATE POLICY "Users can see own bonds" ON bonds
FOR SELECT USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "User 1 can create bond" ON bonds
FOR INSERT WITH CHECK (auth.uid() = user_1_id);

CREATE POLICY "Users can update own bonds" ON bonds
FOR UPDATE USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);


-- Generic Policy Function for "Member of Bond"
-- (Simulated for efficiency in policies)

-- Daily Dews
CREATE POLICY "Bond members views dews" ON daily_dews
FOR SELECT USING (
    EXISTS (SELECT 1 FROM bonds WHERE id = bond_id AND (user_1_id = auth.uid() OR user_2_id = auth.uid()))
);

CREATE POLICY "System/Edge functions insert dews" ON daily_dews
FOR INSERT WITH CHECK (true); -- Ideally restricted to service_role, but explicit role check needed if not using bypass

CREATE POLICY "Members can answer dews" ON daily_dews
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM bonds WHERE id = bond_id AND (user_1_id = auth.uid() OR user_2_id = auth.uid()))
);

-- 4. TRIGGERS AND FUNCTIONS

-- Trigger: Complete Dew (Reveal)
CREATE OR REPLACE FUNCTION check_dew_completion() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_1_response IS NOT NULL AND NEW.user_2_response IS NOT NULL AND NEW.is_revealed = false THEN
        NEW.is_revealed := true;
        
        -- Increment Streak
        UPDATE bonds 
        SET streak_count = streak_count + 1,
            best_streak = GREATEST(best_streak, streak_count + 1)
        WHERE id = NEW.bond_id;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_dew_completion
BEFORE UPDATE ON daily_dews
FOR EACH ROW EXECUTE FUNCTION check_dew_completion();


-- Trigger: New Nug (Push Notification Hook)
-- Note: The actual HTTP call is usually done via a specialized pg_net extension or supabase_functions.http
-- For MVP, we will rely on Realtime client-side, but let's define the hook for the Edge Function invoke if needed using pg_net
-- defaulting to just a basic trigger stub that we could attach a webhook to in the dashboard.
-- For now, we will leave this as just the table insert which client listens to.
