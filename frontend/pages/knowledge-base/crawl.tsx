import { useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';

export default function CrawlSitePage() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function handleCrawl() {
    setErrorMsg('');
    setSuccessMsg('');
    if (!url || !title || !description) {
      setErrorMsg('Please provide url, title, and description');
      return;
    }

    try {
      const resp = await fetch('/api/kb/crawlSite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title, description })
      });
      if (!resp.ok) {
        const text = await resp.text();
        setErrorMsg(`Crawl request failed: ${text}`);
        return;
      }
      setSuccessMsg('Site crawl started. It may take a few minutes.');
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Crawl a Website</h1>
      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
      {successMsg && <p className="text-green-500 mb-4">{successMsg}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Website URL</label>
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            placeholder="Descriptive title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            placeholder="Short description of what's on the site"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleCrawl}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Crawl Site
        </button>
      </div>
    </div>
  );
} 