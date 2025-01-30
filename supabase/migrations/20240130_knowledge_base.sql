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