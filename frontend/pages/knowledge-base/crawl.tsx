import { useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

export default function CrawlPage() {
  const [url, setUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleCrawl() {
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setIsLoading(true);
    try {
      // Get user
      const { data: userData, error: userError } = await supabaseClient.auth.getUser();
      if (userError) throw userError;

      // Get user's org_id
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('org_id')
        .eq('id', userData.user.id)
        .single();

      if (profileError) throw profileError;

      // Start crawl job
      const response = await fetch('/api/kb/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          maxDepth,
          maxPages
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      toast.success('Website crawl started');
      router.push('/knowledge-base');
    } catch (err: any) {
      toast.error(err.message || 'Failed to start crawl');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Crawl Website</h1>

      <div className="max-w-lg space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Depth
          </label>
          <input
            type="number"
            value={maxDepth}
            onChange={(e) => setMaxDepth(parseInt(e.target.value))}
            min={1}
            max={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            How many links deep to crawl (1-5)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Pages
          </label>
          <input
            type="number"
            value={maxPages}
            onChange={(e) => setMaxPages(parseInt(e.target.value))}
            min={1}
            max={50}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Maximum number of pages to crawl (1-50)
          </p>
        </div>

        <button
          onClick={handleCrawl}
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Starting Crawl...' : 'Start Crawl'}
        </button>
      </div>
    </div>
  );
} 