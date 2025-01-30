import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabaseClient } from '../../lib/supabaseClient';

interface OfferDoc {
  id: string;
  title: string;
  description: string;
  content: string;
  metadata: {
    type: 'hormozi_offer';
    status: string;
    last_updated?: string;
  };
}

export default function HormoziOfferPage() {
  const [title, setTitle] = useState('Your Hormozi-Style Offer');
  const [description, setDescription] = useState('Core offer and value proposition');
  const [content, setContent] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [existingOffer, setExistingOffer] = useState<OfferDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchExistingOffer() {
      try {
        const { data: docs, error } = await supabaseClient
          .from('knowledge_docs')
          .select('*')
          .eq('metadata->type', 'hormozi_offer')
          .maybeSingle();

        if (error) throw error;

        if (docs) {
          setExistingOffer(docs);
          setTitle(docs.title);
          setDescription(docs.description);
          setContent(docs.content || '');
        }
      } catch (err: any) {
        setErrorMsg(err.message || String(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchExistingOffer();
  }, []);

  async function handleSave() {
    setErrorMsg('');
    setSuccessMsg('');

    if (!content.trim()) {
      setErrorMsg('Please enter your offer content');
      return;
    }

    try {
      const response = await fetch('/api/kb/saveOffer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          content,
          existingId: existingOffer?.id
        })
      });

      if (!response.ok) {
        const text = await response.text();
        setErrorMsg(`Failed to save offer: ${text}`);
        return;
      }

      setSuccessMsg('Offer saved successfully');
      router.push('/knowledge-base');
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Hormozi-Style Offer</h1>
      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
      {successMsg && <p className="text-green-500 mb-4">{successMsg}</p>}

      <div className="max-w-3xl">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Offer Content</label>
          <div className="bg-gray-50 p-4 rounded-md mb-2">
            <p className="text-sm text-gray-600">
              Write your offer following the Hormozi framework:
            </p>
            <ul className="list-disc ml-5 text-sm text-gray-600">
              <li>What specific result or transformation do you deliver?</li>
              <li>Who exactly is it for?</li>
              <li>How long does it take?</li>
              <li>What makes your approach unique?</li>
              <li>What's included in the offer?</li>
              <li>What's the investment required?</li>
              <li>What guarantees or risk reversals do you provide?</li>
            </ul>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={15}
            placeholder="Enter your offer details..."
          />
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Save Offer
        </button>
      </div>
    </div>
  );
} 