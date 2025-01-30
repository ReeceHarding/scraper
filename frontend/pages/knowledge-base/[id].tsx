import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabaseClient } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface KnowledgeDoc {
  id: string;
  title: string;
  description: string;
  file_path: string | null;
  source_url: string | null;
  created_at: string;
  metadata: Record<string, any>;
}

interface KnowledgeChunk {
  id: string;
  chunk_index: number;
  chunk_content: string;
  token_length: number;
  created_at: string;
}

export default function DocumentDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [doc, setDoc] = useState<KnowledgeDoc | null>(null);
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDocument() {
      if (!id) return;

      try {
        const { data: userData, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !userData?.user) {
          toast.error('Not logged in');
          return;
        }

        // Get user's org_id
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('org_id')
          .eq('id', userData.user.id)
          .single();

        if (!profile?.org_id) {
          toast.error('No organization found');
          return;
        }

        // Load document
        const { data: docData, error: docError } = await supabaseClient
          .from('knowledge_docs')
          .select('*')
          .eq('id', id)
          .eq('org_id', profile.org_id)
          .single();

        if (docError) {
          throw docError;
        }

        if (!docData) {
          toast.error('Document not found');
          router.push('/knowledge-base');
          return;
        }

        setDoc(docData);

        // Load chunks
        const { data: chunksData, error: chunksError } = await supabaseClient
          .from('knowledge_doc_chunks')
          .select('id, chunk_index, chunk_content, token_length, created_at')
          .eq('doc_id', id)
          .order('chunk_index', { ascending: true });

        if (chunksError) {
          throw chunksError;
        }

        setChunks(chunksData || []);
      } catch (err: any) {
        toast.error(err.message || String(err));
      } finally {
        setIsLoading(false);
      }
    }

    loadDocument();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!doc) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">{doc.title}</h1>
        <p className="text-gray-600 mb-4">{doc.description}</p>
        <div className="text-sm text-gray-500">
          {doc.file_path && (
            <p>Source: Uploaded Document</p>
          )}
          {doc.source_url && (
            <p>Source: Crawled from {doc.source_url}</p>
          )}
          <p>Added: {new Date(doc.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Document Chunks</h2>
        <div className="space-y-4">
          {chunks.map((chunk) => (
            <div
              key={chunk.id}
              className="p-4 bg-white rounded-lg shadow"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Chunk {chunk.chunk_index + 1}</span>
                <span className="text-sm text-gray-500">
                  {chunk.token_length} tokens
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {chunk.chunk_content}
              </p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => router.push('/knowledge-base')}
        className="text-blue-600 hover:text-blue-800"
      >
        ← Back to Knowledge Base
      </button>
    </div>
  );
} 