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
      const copy = [...queries];
      copy.splice(i, 1);
      setQueries(copy);
    }
  }

  async function handleSave() {
    setErrorMsg('');
    setSuccessMsg('');
    if (!name || !description || queries.some(q => !q.trim())) {
      setErrorMsg('Please fill in all fields and ensure no empty queries');
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

      setSuccessMsg('Campaign created successfully');
      router.push('/campaigns');
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Campaign</h1>
      
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {errorMsg}
        </div>
      )}
      
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {successMsg}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter campaign name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
            placeholder="Describe your campaign's goals and target audience"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Search Queries
            </label>
            <button
              onClick={handleAddQuery}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              Add Query
            </button>
          </div>

          <div className="space-y-3">
            {queries.map((query, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(idx, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={`Search query ${idx + 1}`}
                />
                {queries.length > 1 && (
                  <button
                    onClick={() => handleRemoveQuery(idx)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
} 