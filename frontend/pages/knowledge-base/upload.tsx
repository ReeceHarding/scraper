import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabaseClient } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function UploadDocPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const allowedFileTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!file || !title || !description) {
      setErrorMsg('Please provide a file, title, and description');
      return;
    }

    if (!allowedFileTypes.includes(file.type)) {
      setErrorMsg('Only PDF, DOCX, and TXT files are allowed');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Check user authentication
      const { data: userData, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error('Not logged in');
      }

      // 2. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('doc_attachments')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const filePath = uploadData?.path;

      // 3. Create knowledge doc record
      const { data: docData, error: docError } = await supabaseClient
        .from('knowledge_docs')
        .insert({
          title,
          description,
          file_path: filePath,
          metadata: { status: 'pending' }
        })
        .select()
        .single();

      if (docError) {
        // If doc creation fails, clean up the uploaded file
        await supabaseClient.storage
          .from('doc_attachments')
          .remove([fileName]);
        throw docError;
      }

      // 4. Trigger embedding process
      const embedResponse = await fetch('/api/kb/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: docData.id })
      });

      if (!embedResponse.ok) {
        throw new Error('Failed to start processing');
      }

      setSuccessMsg('Document uploaded successfully and processing has begun');
      
      // Clear form
      setFile(null);
      setTitle('');
      setDescription('');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/knowledge-base?highlight=' + docData.id);
      }, 2000);

    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMsg(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Upload Document</h1>
          <Link
            href="/knowledge-base"
            className="text-blue-500 hover:text-blue-600"
          >
            Back to Knowledge Base
          </Link>
        </div>

        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleUpload} className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter document title"
              disabled={isUploading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows={4}
              placeholder="Enter document description"
              disabled={isUploading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              File
            </label>
            <input
              type="file"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  setFile(files[0]);
                }
              }}
              accept=".pdf,.docx,.txt"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              disabled={isUploading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Accepted file types: PDF, DOCX, TXT
            </p>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 