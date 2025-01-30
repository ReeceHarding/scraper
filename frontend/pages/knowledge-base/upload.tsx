import { useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function UploadDocPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  async function handleUpload() {
    setErrorMsg('');
    setSuccessMsg('');
    if (!file || !title || !description) {
      setErrorMsg('Please provide file, title, and description');
      return;
    }

    try {
      // 1) Check user
      const { data: userData, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !userData?.user) {
        setErrorMsg('Not logged in');
        return;
      }

      // 2) Upload to doc_attachments bucket
      const fileExt = file.name.split('.').pop();
      const uniqueName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('doc_attachments')
        .upload(uniqueName, file);

      if (uploadError) {
        setErrorMsg(uploadError.message);
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
        setErrorMsg(`Failed to insert doc: ${text}`);
        return;
      }

      setSuccessMsg('File uploaded and doc inserted successfully');
      setFile(null);
      setTitle('');
      setDescription('');
      router.push('/knowledge-base');
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Upload a Document</h1>
      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
      {successMsg && <p className="text-green-500 mb-4">{successMsg}</p>}

      <div className="max-w-lg">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter document title"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={4}
            placeholder="Enter document description"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Choose File</label>
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
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Upload and Process
        </button>
      </div>
    </div>
  );
} 