import { useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import Link from 'next/link';
import { format } from 'date-fns';

interface KnowledgeDoc {
  id: string;
  title: string;
  description: string;
  file_path: string;
  source_url: string | null;
  created_at: string;
}

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchDocs();
  }, []);

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
        <Link
          href="/knowledge-base/upload"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Upload Document
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No documents uploaded yet.</p>
          <Link
            href="/knowledge-base/upload"
            className="text-indigo-600 hover:text-indigo-800"
          >
            Upload your first document
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">{doc.title}</h3>
              <p className="text-gray-600 mb-4">{doc.description}</p>
              <div className="text-sm text-gray-500">
                Uploaded on {format(new Date(doc.created_at), 'MMM d, yyyy')}
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