-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_org_id ON public.knowledge_docs(org_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_doc_chunks_doc_id ON public.knowledge_doc_chunks(doc_id);

-- Disable RLS
ALTER TABLE public.knowledge_docs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_doc_chunks DISABLE ROW LEVEL SECURITY;

-- Create storage bucket for document attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('doc_attachments', 'doc_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to doc_attachments bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'doc_attachments');

-- Allow authenticated users to upload to doc_attachments bucket
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'doc_attachments'
  AND auth.role() = 'authenticated'
);

-- Create outreach_campaigns table
CREATE TABLE IF NOT EXISTS public.outreach_campaigns (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create outreach_companies table
CREATE TABLE IF NOT EXISTS public.outreach_companies (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
  domain text NOT NULL,
  name text,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, domain)
);

-- Create outreach_contacts table
CREATE TABLE IF NOT EXISTS public.outreach_contacts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.outreach_companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  title text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, email)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS outreach_campaigns_org_id_idx ON public.outreach_campaigns(org_id);
CREATE INDEX IF NOT EXISTS outreach_companies_campaign_id_idx ON public.outreach_companies(campaign_id);
CREATE INDEX IF NOT EXISTS outreach_contacts_company_id_idx ON public.outreach_contacts(company_id); 