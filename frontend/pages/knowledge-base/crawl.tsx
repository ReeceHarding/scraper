import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabaseClient } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function CrawlWebsitePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [maxPages, setMaxPages] = useState(50);
  const [maxDepth, setMaxDepth] = useState(3);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  async function handleCrawl() {
    setErrorMsg('');
    setSuccessMsg('');

    if (!title || !description || !sourceUrl) {
      setErrorMsg('Please provide title, description, and URL');
      return;
    }

    try {
      // Validate URL
      new URL(sourceUrl);

      const response = await fetch('/api/kb/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          sourceUrl,
          maxPages,
          maxDepth
        })
      });

      if (!response.ok) {
        const text = await response.text();
        setErrorMsg(`Failed to start crawling: ${text}`);
        return;
      }

      setSuccessMsg('Website crawling started');
      router.push('/knowledge-base');
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Crawl Website</h1>
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
            <label className="block text-sm font-medium mb-2">Website URL</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="https://example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Max Pages</label>
              <input
                type="number"
                value={maxPages}
                onChange={(e) => setMaxPages(parseInt(e.target.value))}
                min={1}
                max={100}
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-sm text-gray-500 mt-1">Maximum pages to crawl (1-100)</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Depth</label>
              <input
                type="number"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                min={1}
                max={5}
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-sm text-gray-500 mt-1">Maximum link depth (1-5)</p>
            </div>
          </div>

          <button
            onClick={handleCrawl}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Start Crawling
          </button>
        </div>
      </div>
    </div>
  );
} 