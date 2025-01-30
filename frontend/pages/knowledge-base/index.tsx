import { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/router';

interface KnowledgeDoc {
  id: string;
  title: string;
  description: string;
  source_url: string | null;
  file_path: string | null;
  created_at: string;
  metadata: {
    status?: string;
    error?: string;
  };
}

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const highlightedDocId = router.query.highlight as string;

  useEffect(() => {
    const subscription = supabaseClient
      .channel('knowledge_docs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'knowledge_docs'
        },
        (payload) => {
          // Refresh docs when there's a change
          fetchDocs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    try {
      const { data: userData, error: userError } = await supabaseClient.auth.getUser();
      if (userError) throw userError;

      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('org_id')
        .eq('id', userData.user.id)
        .single();

      if (profileError) throw profileError;

      const { data: docs, error: docsError } = await supabaseClient
        .from('knowledge_docs')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      setDocs(docs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <div className="space-x-4">
          <Link
            href="/knowledge-base/crawl"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Crawl Website
          </Link>
          <Link
            href="/knowledge-base/upload"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Upload Document
          </Link>
          <Link
            href="/knowledge-base/offer"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Edit Offer
          </Link>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No documents uploaded yet.</p>
          <div className="space-x-4">
            <Link
              href="/knowledge-base/upload"
              className="text-indigo-600 hover:text-indigo-800"
            >
              Upload your first document
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/knowledge-base/crawl"
              className="text-indigo-600 hover:text-indigo-800"
            >
              Crawl a website
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow ${
                doc.id === highlightedDocId ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <h3 className="text-xl font-semibold mb-2">{doc.title}</h3>
              <p className="text-gray-600 mb-4">{doc.description}</p>
              
              {doc.metadata?.status && (
                <div className={`text-sm mb-4 ${
                  doc.metadata.status === 'completed' ? 'text-green-600' :
                  doc.metadata.status === 'failed' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  Status: {doc.metadata.status}
                  {doc.metadata.error && (
                    <p className="text-red-600 mt-1">{doc.metadata.error}</p>
                  )}
                </div>
              )}

              <div className="text-sm text-gray-500">
                Added on {format(new Date(doc.created_at), 'MMM d, yyyy')}
              </div>

              {doc.source_url && (
                <a
                  href={doc.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-sm mt-2 block"
                >
                  View Source
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 