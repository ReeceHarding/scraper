import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabaseClient } from '../../lib/supabaseClient';

interface OfferDoc {
  id: string;
  title: string;
  description: string;
  content: string;
  metadata: {
    is_offer: boolean;
    status: string;
  };
}

export default function OfferPage() {
  const [offerText, setOfferText] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchOffer() {
      try {
        const { data: authData } = await supabaseClient.auth.getUser();
        if (!authData?.user) {
          setErrorMsg('Not logged in');
          router.push('/auth/login');
          return;
        }

        const { data: docs, error } = await supabaseClient
          .from('knowledge_docs')
          .select('*')
          .eq('metadata->is_offer', true)
          .limit(1);

        if (error) {
          console.error('Error fetching offer:', error);
          setErrorMsg(error.message);
          return;
        }

        if (docs && docs.length > 0) {
          const offer = docs[0] as OfferDoc;
          setTitle(offer.title);
          setDescription(offer.description);
          setOfferText(offer.content || '');
        }
      } catch (err: any) {
        console.error('Error in fetchOffer:', err);
        setErrorMsg(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchOffer();
  }, [router]);

  async function handleSave() {
    setErrorMsg('');
    setSuccessMsg('');
    if (!offerText.trim() || !title.trim() || !description.trim()) {
      setErrorMsg('Please provide title, description, and offer text');
      return;
    }

    try {
      const response = await fetch('/api/kb/saveOffer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          content: offerText
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Hormozi-Style Offer</h1>
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

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., Our Core Offer"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., Our main value proposition"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Offer Text
              <span className="text-gray-500 ml-2">
                (Write your offer in Hormozi style)
              </span>
            </label>
            <textarea
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md h-64"
              placeholder="Describe your offer in detail..."
            />
            <p className="text-sm text-gray-500 mt-2">
              Pro tip: Follow Alex Hormozi's framework - Problem → Agitation → Solution → Result
            </p>
          </div>

          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Save Offer
          </button>
        </div>
      </div>
    </div>
  );
} 