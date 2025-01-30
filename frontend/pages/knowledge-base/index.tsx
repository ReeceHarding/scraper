import { useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface KnowledgeDoc {
  id: string;
  title: string;
  description: string;
  file_path?: string;
  source_url?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export default function KnowledgeBaseHome() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchDocs() {
      try {
        const { data: authData } = await supabaseClient.auth.getUser();
        if (!authData?.user) {
          setErrorMsg('Not logged in');
          router.push('/auth/login');
          return;
        }

        const { data: docData, error } = await supabaseClient
          .from('knowledge_docs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching docs:', error);
          setErrorMsg(error.message);
          return;
        }

        setDocs(docData || []);
      } catch (err: any) {
        console.error('Error in fetchDocs:', err);
        setErrorMsg(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchDocs();
  }, [router]);

  function getStatus(doc: KnowledgeDoc): string {
    return doc.metadata?.status || 'pending';
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <div className="space-x-4">
          <Link 
            href="/knowledge-base/upload"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Upload Document
          </Link>
          <Link 
            href="/knowledge-base/crawl"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Crawl Website
          </Link>
          <Link 
            href="/knowledge-base/offer"
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          >
            Hormozi Offer
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No documents found. Start by uploading a document or crawling a website.
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{doc.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {doc.file_path ? '📄 File' : doc.source_url ? '🌐 Website' : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      getStatus(doc) === 'embedded' 
                        ? 'bg-green-100 text-green-800'
                        : getStatus(doc) === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatus(doc)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 