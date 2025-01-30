-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  email text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create knowledge_docs table
CREATE TABLE IF NOT EXISTS public.knowledge_docs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  file_path text,
  source_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create knowledge_doc_chunks table
CREATE TABLE IF NOT EXISTS public.knowledge_doc_chunks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  doc_id uuid NOT NULL REFERENCES public.knowledge_docs(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  chunk_content text NOT NULL,
  embedding vector(1536),
  token_length integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create outreach_campaigns table
CREATE TABLE IF NOT EXISTS public.outreach_campaigns (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create outreach_companies table
CREATE TABLE IF NOT EXISTS public.outreach_companies (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
  domain text NOT NULL,
  status text NOT NULL DEFAULT 'scraped',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create outreach_contacts table
CREATE TABLE IF NOT EXISTS public.outreach_contacts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.outreach_companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create auto-update timestamp function
CREATE OR REPLACE FUNCTION public.fn_auto_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER tr_organizations_update_timestamp
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_update_timestamp();

CREATE TRIGGER tr_profiles_update_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_update_timestamp();

CREATE TRIGGER tr_knowledge_docs_update_timestamp
  BEFORE UPDATE ON public.knowledge_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_update_timestamp();

CREATE TRIGGER tr_knowledge_doc_chunks_update_timestamp
  BEFORE UPDATE ON public.knowledge_doc_chunks
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_update_timestamp();

CREATE TRIGGER tr_outreach_campaigns_update_timestamp
  BEFORE UPDATE ON public.outreach_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_update_timestamp();

CREATE TRIGGER tr_outreach_companies_update_timestamp
  BEFORE UPDATE ON public.outreach_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_update_timestamp();

CREATE TRIGGER tr_outreach_contacts_update_timestamp
  BEFORE UPDATE ON public.outreach_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_update_timestamp(); 