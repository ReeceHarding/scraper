import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabaseClient } from '../../lib/supabaseClient';

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [queries, setQueries] = useState(['']);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  function handleAddQuery() {
    setQueries([...queries, '']);
  }

  function handleQueryChange(i: number, value: string) {
    const copy = [...queries];
    copy[i] = value;
    setQueries(copy);
  }

  function handleRemoveQuery(i: number) {
    if (queries.length > 1) {
      const copy = queries.filter((_, index) => index !== i);
      setQueries(copy);
    }
  }

  async function handleSave() {
    setErrorMsg('');
    setSuccessMsg('');
    if (!name || !description || queries.some(q => !q.trim())) {
      setErrorMsg('Missing fields or empty queries');
      return;
    }
    try {
      const resp = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, queries: queries.filter(q => q.trim()) })
      });
      if (!resp.ok) {
        const text = await resp.text();
        setErrorMsg(text);
        return;
      }
      setSuccessMsg('Campaign created');
      router.push('/campaigns');
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Campaign</h1>
      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
      {successMsg && <p className="text-green-500 mb-4">{successMsg}</p>}
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter campaign name"
            className="w-full p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your campaign"
            className="w-full p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Queries
          </label>
          <p className="text-sm text-gray-500 mb-4">
            Add search queries to find potential leads. Each query will be used to search for companies.
          </p>
          
          <div className="space-y-3">
            {queries.map((q, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={q}
                  onChange={(e) => handleQueryChange(idx, e.target.value)}
                  placeholder="e.g., 'software companies in San Francisco'"
                  className="flex-1 p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                {queries.length > 1 && (
                  <button
                    onClick={() => handleRemoveQuery(idx)}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={handleAddQuery}
            className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Another Query
          </button>
        </div>
        
        <div className="pt-4">
          <button
            onClick={handleSave}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
} 