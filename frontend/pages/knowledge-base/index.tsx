import { useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface KnowledgeDoc {
  id: string;
  title: string;
  description: string;
  file_path: string | null;
  source_url: string | null;
  created_at: string;
}

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDocs() {
      try {
        const { data: userData, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !userData?.user) {
          toast.error('Not logged in');
          return;
        }

        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('org_id')
          .eq('id', userData.user.id)
          .single();

        if (!profile?.org_id) {
          toast.error('No organization found');
          return;
        }

        const { data: docsData, error: docsError } = await supabaseClient
          .from('knowledge_docs')
          .select('*')
          .eq('org_id', profile.org_id)
          .order('created_at', { ascending: false });

        if (docsError) {
          throw docsError;
        }

        setDocs(docsData || []);
      } catch (err: any) {
        toast.error(err.message || String(err));
      } finally {
        setIsLoading(false);
      }
    }

    loadDocs();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <div className="space-x-4">
          <Link 
            href="/knowledge-base/upload"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Upload Document
          </Link>
          <Link
            href="/knowledge-base/crawl"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Crawl Website
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No documents found. Start by uploading a document or crawling a website.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">{doc.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{doc.description}</p>
              <div className="text-sm text-gray-500">
                {doc.file_path && (
                  <p>Type: Document Upload</p>
                )}
                {doc.source_url && (
                  <p>Type: Website Crawl</p>
                )}
                <p>Added: {new Date(doc.created_at).toLocaleDateString()}</p>
              </div>
              <Link
                href={`/knowledge-base/${doc.id}`}
                className="mt-4 inline-block text-blue-600 hover:text-blue-800"
              >
                View Details →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 