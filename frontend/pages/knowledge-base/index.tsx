import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabaseClient } from '../../lib/supabaseClient';
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
  const router = useRouter();

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    try {
      const { data: docs, error } = await supabaseClient
        .from('knowledge_docs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocs(docs || []);
    } catch (error: any) {
      toast.error('Failed to load documents');
      console.error('Error loading docs:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabaseClient
        .from('knowledge_docs')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      toast.success('Document deleted');
      loadDocs();
    } catch (error: any) {
      toast.error('Failed to delete document');
      console.error('Error deleting doc:', error);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <Link
          href="/knowledge-base/upload"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Upload Document
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No documents found. Start by uploading a document.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="p-6 bg-white rounded-lg shadow-md border border-gray-200"
            >
              <h3 className="text-xl font-semibold mb-2">{doc.title}</h3>
              <p className="text-gray-600 mb-4">{doc.description}</p>
              <div className="text-sm text-gray-500 mb-4">
                Added on {new Date(doc.created_at).toLocaleDateString()}
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
                {doc.file_path && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/doc_attachments/${doc.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    View File
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 