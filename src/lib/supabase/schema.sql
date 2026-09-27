-- ==========================================================
-- KIZUNA: AI-powered Road Safety & Accountability Platform
-- Supabase PostgreSQL Database Schema
-- Sewa Setu Innovation Hackathon 2026
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Citizens & Authority Personnel)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'authority', 'admin')),
  authority_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Authorities Registry Table
CREATE TABLE IF NOT EXISTS public.authorities (
  id TEXT PRIMARY KEY,
  authority_name TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Central', 'State', 'District', 'Municipal', 'Panchayat')),
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  road_categories TEXT[] NOT NULL,
  contact_email TEXT NOT NULL,
  portal_user_id TEXT NOT NULL,
  escalation_authority TEXT,
  active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Road Segments Table
CREATE TABLE IF NOT EXISTS public.road_segments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  road_name TEXT NOT NULL,
  road_category TEXT NOT NULL,
  place_id TEXT,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  snapped_coords JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Citizen Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  citizen_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  formatted_address TEXT,
  locality TEXT,
  district TEXT,
  state TEXT,
  road_name TEXT,
  road_place_id TEXT,
  hazard_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence DOUBLE PRECISION NOT NULL,
  description TEXT NOT NULL,
  requires_attention BOOLEAN DEFAULT TRUE,
  visible_road_clues TEXT[],
  additional_hazards TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Accident Reports Table (Aggregated Public News Intelligence)
CREATE TABLE IF NOT EXISTS public.accident_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  road_segment_id UUID REFERENCES public.road_segments(id) ON DELETE SET NULL,
  case_id TEXT,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  event_date DATE,
  location_text TEXT,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  relevance TEXT NOT NULL CHECK (relevance IN ('HIGH', 'MEDIUM', 'LOW', 'NOT_RELEVANT')),
  relevance_reason TEXT,
  url TEXT NOT NULL,
  snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Cases Table (Accountability & Lifecycle Management)
CREATE TABLE IF NOT EXISTS public.cases (
  id TEXT PRIMARY KEY, -- e.g. KZ-2026-00124 or KZ-DEMO-001
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  citizen_id TEXT NOT NULL,
  authority_id TEXT REFERENCES public.authorities(id),
  image_url TEXT NOT NULL,
  location_data JSONB NOT NULL,
  hazard_analysis JSONB NOT NULL,
  accident_intelligence JSONB NOT NULL,
  authority_routing JSONB NOT NULL,
  priority_assessment JSONB NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'AI_ANALYZED', 'AUTHORITY_IDENTIFIED', 'SUBMITTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED')),
  citizen_report_count INT DEFAULT 1,
  assigned_officer JSONB,
  resolution_notes TEXT,
  resolution_evidence JSONB,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- 7. Case Updates / Status Timeline Table
CREATE TABLE IF NOT EXISTS public.case_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id TEXT REFERENCES public.cases(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  actor TEXT NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('CITIZEN', 'SYSTEM_AI', 'AUTHORITY')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('citizen', 'authority')),
  case_id TEXT REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Basic Public Access & Development Policies
CREATE POLICY "Public profiles can be viewed by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Reports viewable by creator or authorities" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Cases viewable by all authorized stakeholders" ON public.cases FOR SELECT USING (true);
CREATE POLICY "Cases updatable by authorities" ON public.cases FOR UPDATE USING (true);
CREATE POLICY "Case updates viewable by all" ON public.case_updates FOR SELECT USING (true);
CREATE POLICY "Notifications viewable by recipient" ON public.notifications FOR SELECT USING (true);
