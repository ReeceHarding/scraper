import { useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

export default function UploadDocPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleUpload() {
    if (!file || !title || !description) {
      toast.error('Please provide file, title, and description');
      return;
    }

    setIsLoading(true);
    try {
      // 1) Check user
      const { data: userData, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !userData?.user) {
        toast.error('Not logged in');
        return;
      }

      // 2) Upload to doc_attachments bucket
      const fileExt = file.name.split('.').pop();
      const uniqueName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('doc_attachments')
        .upload(uniqueName, file);

      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }

      const filePath = uploadData?.path || uniqueName;

      // 3) Insert knowledge_doc record
      const docInsert = await fetch('/api/kb/insertDoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          filePath
        })
      });

      if (!docInsert.ok) {
        const text = await docInsert.text();
        toast.error(`Failed to insert doc: ${text}`);
        return;
      }

      toast.success('Document uploaded successfully');
      router.push('/knowledge-base');
    } catch (err: any) {
      toast.error(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Upload a Document</h1>

      <div className="max-w-lg space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter document title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
            placeholder="Enter document description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose File
          </label>
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setFile(e.target.files[0]);
              }
            }}
            className="w-full"
            accept=".pdf,.doc,.docx,.txt"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Uploading...' : 'Upload and Process'}
        </button>
      </div>
    </div>
  );
} 