import { useState, ChangeEvent } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

// Basic UI components since we don't have the common components yet
const Input = ({ type, value, onChange, placeholder, accept, className = '' }: {
  type: string;
  value?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  accept?: string;
  className?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    accept={accept}
    className={`w-full px-3 py-2 border rounded-md ${className}`}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 4, className = '' }: {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className={`w-full px-3 py-2 border rounded-md ${className}`}
  />
);

const Button = ({ onClick, disabled, className = '', children }: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

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
        throw new Error(`Failed to insert doc: ${text}`);
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
      <h1 className="text-2xl font-bold mb-6">Upload a Document</h1>

      <div className="max-w-lg space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter document description"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Choose File</label>
          <Input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setFile(e.target.files[0]);
              }
            }}
          />
          <p className="text-sm text-gray-500 mt-1">
            Supported formats: PDF, DOC, DOCX, TXT
          </p>
        </div>

        <Button
          onClick={handleUpload}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </div>
    </div>
  );
} 