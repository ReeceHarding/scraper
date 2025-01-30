import { useState } from 'react';

export default function OfferPage() {
  const [offerText, setOfferText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSave() {
    setErrorMsg('');
    setSuccessMsg('');
    if (!offerText.trim()) {
      setErrorMsg('Offer text cannot be empty');
      return;
    }

    try {
      const resp = await fetch('/api/kb/saveOffer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerText })
      });
      if (!resp.ok) {
        const text = await resp.text();
        setErrorMsg(`Failed: ${text}`);
        return;
      }
      setSuccessMsg('Offer saved and embedding job enqueued');
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Hormozi-Style Offer</h1>
      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
      {successMsg && <p className="text-green-500 mb-4">{successMsg}</p>}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter your no-brainer offer text
          </label>
          <textarea
            className="w-full h-64 p-4 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={offerText}
            onChange={(e) => setOfferText(e.target.value)}
            placeholder="Enter your compelling offer that makes it impossible for prospects to say no..."
          />
        </div>
        
        <button
          onClick={handleSave}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Save Offer
        </button>
      </div>
    </div>
  );
} 