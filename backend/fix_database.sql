-- Fix Database Migration Issue
-- Run this to clean up the partial migration and start fresh

-- Connect to database first:
-- psql -h localhost -p 4201 -U supervision_user -d supervision_maintenance

-- Option 1: DROP ALL TABLES (⚠️  LOSES ALL DATA)
-- Use this if you don't have important data yet

-- Drop all tables
DROP TABLE IF EXISTS public.intervention_intervenants CASCADE;
DROP TABLE IF EXISTS public.interventions CASCADE;
DROP TABLE IF EXISTS public.intervenants CASCADE;
DROP TABLE IF EXISTS public.intervenant_profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.predefined_values CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.migrations CASCADE;
DROP TABLE IF EXISTS public.typeorm_metadata CASCADE;

-- Drop all enums (more comprehensive)
DROP TYPE IF EXISTS public.user_role_enum CASCADE;
DROP TYPE IF EXISTS public.users_role_enum CASCADE;
DROP TYPE IF EXISTS public.audit_logs_entitytype_enum CASCADE;
DROP TYPE IF EXISTS public.audit_logs_action_enum CASCADE;
DROP TYPE IF EXISTS public.predefined_values_type_enum CASCADE;
DROP TYPE IF EXISTS public.predefined_value_type_enum CASCADE;

-- Now migrations can run cleanly from scratch
