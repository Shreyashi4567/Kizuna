-- ==============================================================================
-- KIZUNA: AI-Powered Road Safety & Accountability Platform
-- Master Central Supabase Schema for Web + Future Mobile App (Flutter / React Native)
-- Project: flvrvieqxpxmmwavzkbp
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Master Tables
-- ==============================================================================

-- 2.1 Statutory Authorities Registry Table
CREATE TABLE IF NOT EXISTS public.authorities (
  id TEXT PRIMARY KEY, -- e.g. 'NHAI_RO_CG', 'CG_PWD_DIV1', 'RMC_CIVIL', 'CG_RRDA_PMGSY'
  authority_name TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Central', 'State', 'District', 'Municipal', 'Panchayat')),
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  road_categories TEXT[] NOT NULL DEFAULT '{}',
  contact_email TEXT NOT NULL,
  portal_user_id TEXT NOT NULL,
  escalation_authority TEXT,
  active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Master Reports Table (Shared for Web, Mobile, and Authority Portal)
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY, -- Case ID (e.g. 'KZ-2026-00124' or 'KZ-DEMO-001')
  citizen_id TEXT NOT NULL DEFAULT 'cit-anon-001',
  image_url TEXT NOT NULL,
  storage_path TEXT, -- Storage path in 'report-images' bucket
  
  -- Geographic & Road Location
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  formatted_address TEXT NOT NULL,
  locality TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  road_name TEXT NOT NULL,
  road_place_id TEXT NOT NULL,
  road_category TEXT NOT NULL DEFAULT 'other',
  pincode TEXT,
  gps_accuracy DOUBLE PRECISION,
  location_source TEXT NOT NULL DEFAULT 'gps', -- 'gps' | 'manual' | 'preset'
  
  -- AI Road Hazard Vision Analysis (Groq Vision)
  hazard_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence DOUBLE PRECISION NOT NULL,
  description TEXT NOT NULL,
  requires_attention BOOLEAN NOT NULL DEFAULT TRUE,
  visible_road_clues TEXT[] DEFAULT '{}',
  additional_hazards TEXT[] DEFAULT '{}',
  
  -- Statutory Authority Routing
  authority_id TEXT NOT NULL REFERENCES public.authorities(id) ON UPDATE CASCADE,
  authority_name TEXT NOT NULL,
  authority_department TEXT NOT NULL,
  authority_jurisdiction TEXT NOT NULL,
  routing_confidence DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  routing_reason TEXT NOT NULL,
  
  -- AI Priority Engine
  priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  priority_confidence DOUBLE PRECISION NOT NULL DEFAULT 0.9,
  priority_explanation TEXT,
  priority_factors TEXT[] DEFAULT '{}',
  
  -- Case Status & Lifecycle
  status TEXT NOT NULL DEFAULT 'REPORTED' CHECK (status IN (
    'REPORTED',
    'AI_ANALYZED',
    'AUTHORITY_IDENTIFIED',
    'SUBMITTED',
    'ACKNOWLEDGED',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED'
  )),
  citizen_report_count INT NOT NULL DEFAULT 1,
  
  -- Field Assignment & Resolution
  assigned_officer_name TEXT,
  assigned_officer_badge TEXT,
  assigned_officer_division TEXT,
  resolution_notes TEXT,
  
  -- Demo flag to cleanly isolate presentation benchmarks from real citizen reports
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- 2.3 Status History / Case Timeline Table (Shared for Web, Mobile, Authority)
CREATE TABLE IF NOT EXISTS public.report_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  actor TEXT NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('CITIZEN', 'SYSTEM_AI', 'AUTHORITY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 Accident Intelligence Precedents Table (100 km Radius Corridor)
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  event_date DATE,
  location_text TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  relevance TEXT NOT NULL CHECK (relevance IN ('HIGH', 'MEDIUM', 'LOW', 'NOT_RELEVANT')),
  relevance_reason TEXT,
  snippet TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION,
  casualties INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Resolution Verifications Table (AI Visual Proof of Road Remediations)
CREATE TABLE IF NOT EXISTS public.resolution_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  after_storage_path TEXT,
  hazard_before TEXT NOT NULL,
  hazard_visible_after BOOLEAN NOT NULL,
  visual_resolution_confidence DOUBLE PRECISION NOT NULL,
  explanation TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. Row Level Security (RLS) Configuration
-- ==============================================================================

ALTER TABLE public.authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolution_verifications ENABLE ROW LEVEL SECURITY;

-- Authorities Registry: Public read-only
CREATE POLICY "Authorities viewable by all clients" ON public.authorities
  FOR SELECT USING (true);

-- Reports: Public & Authenticated Read, Insert, Update
CREATE POLICY "Reports readable by all clients" ON public.reports
  FOR SELECT USING (true);

CREATE POLICY "Reports insertable by citizens and mobile apps" ON public.reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Reports updatable by authorities and clients" ON public.reports
  FOR UPDATE USING (true) WITH CHECK (true);

-- Report Status History: Public Read & Insert
CREATE POLICY "Status history viewable by all clients" ON public.report_status_history
  FOR SELECT USING (true);

CREATE POLICY "Status history insertable by clients" ON public.report_status_history
  FOR INSERT WITH CHECK (true);

-- Incidents: Public Read & Insert
CREATE POLICY "Incidents viewable by all clients" ON public.incidents
  FOR SELECT USING (true);

CREATE POLICY "Incidents insertable by clients" ON public.incidents
  FOR INSERT WITH CHECK (true);

-- Resolution Verifications: Public Read & Insert
CREATE POLICY "Resolution verifications viewable by all clients" ON public.resolution_verifications
  FOR SELECT USING (true);

CREATE POLICY "Resolution verifications insertable by clients" ON public.resolution_verifications
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 4. Supabase Storage Buckets
-- ==============================================================================

-- Create Storage buckets if storage schema exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('resolution-images', 'resolution-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Public Read Access for Report Images" ON storage.objects
  FOR SELECT USING (bucket_id IN ('report-images', 'resolution-images'));

CREATE POLICY "Public Insert Access for Report Images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('report-images', 'resolution-images'));

CREATE POLICY "Public Update Access for Report Images" ON storage.objects
  FOR UPDATE USING (bucket_id IN ('report-images', 'resolution-images'));

-- ==============================================================================
-- 5. Seed Core Government Road Authorities
-- ==============================================================================

INSERT INTO public.authorities (
  id, authority_name, department, level, state, district, jurisdiction,
  road_categories, contact_email, portal_user_id, escalation_authority, is_demo
) VALUES
(
  'NHAI_RO_CG',
  'National Highways Authority of India (NHAI)',
  'Ministry of Road Transport and Highways (MoRTH)',
  'Central',
  'Chhattisgarh',
  'Raipur',
  'National Highway corridors NH-30, NH-53, NH-130 and expressways traversing Chhattisgarh.',
  ARRAY['national_highway'],
  'ro-raipur@nhai.org',
  'nhai_raipur_piu',
  'MoRTH Central Grievance Cell, New Delhi',
  false
),
(
  'CG_PWD_DIV1',
  'Chhattisgarh Public Works Department (State Highways Division)',
  'Public Works Department, Govt. of Chhattisgarh',
  'State',
  'Chhattisgarh',
  'Raipur',
  'State Highways (SH-1 to SH-22) and Major District Roads (MDR) under Raipur Division 1.',
  ARRAY['state_highway', 'district_road'],
  'ee-pwd-raipur@cg.gov.in',
  'cgpwd_raipur_div1',
  'Engineer-in-Chief, PWD Raipur Head Office',
  false
),
(
  'RMC_CIVIL',
  'Raipur Municipal Corporation (Engineering Department)',
  'Urban Administration & Development Department, Chhattisgarh',
  'Municipal',
  'Chhattisgarh',
  'Raipur',
  'Urban arterial roads, colony streets, flyover approaches within RMC municipal limits.',
  ARRAY['municipal_road', 'other'],
  'commissioner@raipurcorporation.com',
  'rmc_commissioner_cell',
  'Secretary, Urban Administration Department, Nawa Raipur',
  false
),
(
  'CG_RRDA_PMGSY',
  'Chhattisgarh Rural Road Development Agency (PMGSY PIU Raipur)',
  'Panchayat & Rural Development Department, Chhattisgarh',
  'Panchayat',
  'Chhattisgarh',
  'Raipur',
  'Pradhan Mantri Gram Sadak Yojana (PMGSY) rural connectivity corridors connecting habitations.',
  ARRAY['rural_road', 'village_internal_road'],
  'piu-raipur@pmgsy.nic.in',
  'pmgsy_raipur_piu',
  'Chief Executive Officer, CGRRDA, Raipur',
  false
)
ON CONFLICT (id) DO UPDATE SET
  authority_name = EXCLUDED.authority_name,
  department = EXCLUDED.department,
  jurisdiction = EXCLUDED.jurisdiction;

-- ==============================================================================
-- 6. Seed Demo Benchmark Case (KZ-DEMO-001) for Instant Judge Verification
-- ==============================================================================

INSERT INTO public.reports (
  id, citizen_id, image_url, storage_path,
  latitude, longitude, formatted_address, locality, district, state,
  road_name, road_place_id, road_category, pincode, gps_accuracy, location_source,
  hazard_type, severity, confidence, description, requires_attention,
  visible_road_clues, additional_hazards,
  authority_id, authority_name, authority_department, authority_jurisdiction,
  routing_confidence, routing_reason,
  priority, priority_confidence, priority_explanation, priority_factors,
  status, citizen_report_count,
  assigned_officer_name, assigned_officer_badge, assigned_officer_division,
  is_demo, created_at, updated_at, acknowledged_at, assigned_at
) VALUES
(
  'KZ-DEMO-001',
  'cit-demo-001',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
  'report-images/KZ-DEMO-001/pothole_nh30.jpg',
  21.2514,
  81.5832,
  'NH-30, Tatibandh Interchange, Raipur, Chhattisgarh 492099',
  'Tatibandh Interchange',
  'Raipur',
  'Chhattisgarh',
  'NH-30 (Durg-Raipur Highway)',
  'osm_way_24681357',
  'national_highway',
  '492099',
  4.2,
  'gps',
  'pothole',
  'critical',
  0.96,
  'Deep structural crater (approx. 45cm diameter, 12cm depth) located on high-speed lane approach with fractured bitumen edges and exposed wet aggregate.',
  true,
  ARRAY['High-speed multi-lane divided carriageway', 'Concrete median barrier on right', 'Heavy commercial freight transit markings'],
  ARRAY['High risk of two-wheeler rollover', 'Night visibility blindness', 'Sudden vehicular swerving'],
  'NHAI_RO_CG',
  'National Highways Authority of India (NHAI)',
  'Ministry of Road Transport and Highways (MoRTH)',
  'National Highway corridors NH-30, NH-53, NH-130 traversing Chhattisgarh.',
  0.98,
  'Highway NH-30 is a designated National Highway corridor falling directly under statutory maintenance jurisdiction of NHAI RO Raipur.',
  'CRITICAL',
  0.95,
  'Critical risk: severe pothole on high-speed National Highway corridor with 3 historical fatal/serious collisions in public records within 100km radius.',
  ARRAY['Hazard severity is CRITICAL on high-speed corridor', 'Historical fatality precedents documented in public archives', 'Heavy multi-axle freight traffic volume on NH-30 corridor'],
  'ASSIGNED',
  4,
  'Er. Rajesh Kumar Sharma',
  'NHAI-RO-AE-4102',
  'Raipur Highway Maintenance Unit',
  true,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '1 hour 45 minutes',
  NOW() - INTERVAL '1 hour 15 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Status History for Demo Case
INSERT INTO public.report_status_history (report_id, status, title, comment, actor, actor_role, created_at)
VALUES
(
  'KZ-DEMO-001',
  'REPORTED',
  'Citizen Hazard Logged',
  'Photograph and GPS location uploaded via KIZUNA Civic Portal.',
  'Verified Citizen (Anonymous ID: cit-demo-001)',
  'CITIZEN',
  NOW() - INTERVAL '2 hours'
),
(
  'KZ-DEMO-001',
  'AI_ANALYZED',
  'Groq Vision & Accident Precedents Evaluated',
  'Groq Vision detected critical pothole. 3 historical accident reports mapped within 100km corridor.',
  'KIZUNA AI Intelligence Pipeline',
  'SYSTEM_AI',
  NOW() - INTERVAL '1 hour 58 minutes'
),
(
  'KZ-DEMO-001',
  'AUTHORITY_IDENTIFIED',
  'Statutory Authority Routed',
  'Matched to NHAI PIU Raipur under National Highways jurisdiction rules.',
  'Authority Routing Engine',
  'SYSTEM_AI',
  NOW() - INTERVAL '1 hour 55 minutes'
),
(
  'KZ-DEMO-001',
  'ACKNOWLEDGED',
  'Case Acknowledged',
  'NHAI Control Center logged intake and scheduled immediate field inspection.',
  'NHAI RO Raipur Desk',
  'AUTHORITY',
  NOW() - INTERVAL '1 hour 45 minutes'
),
(
  'KZ-DEMO-001',
  'ASSIGNED',
  'Field Officer Assigned',
  'Assigned to Er. Rajesh Kumar Sharma (Badge NHAI-RO-AE-4102) for rapid repair dispatch.',
  'NHAI Project Director',
  'AUTHORITY',
  NOW() - INTERVAL '1 hour 15 minutes'
)
ON CONFLICT DO NOTHING;
