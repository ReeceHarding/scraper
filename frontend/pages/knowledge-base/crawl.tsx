import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabaseClient } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function CrawlPage() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const router = useRouter();

  async function handleCrawl(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!url || !title || !description) {
      setErrorMsg('Please provide a URL, title, and description');
      return;
    }

    try {
      // Validate URL
      new URL(url);
    } catch {
      setErrorMsg('Please enter a valid URL');
      return;
    }

    setIsCrawling(true);

    try {
      // 1. Check user authentication
      const { data: userData, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error('Not logged in');
      }

      // 2. Create knowledge doc record first
      const { data: docData, error: docError } = await supabaseClient
        .from('knowledge_docs')
        .insert({
          title,
          description,
          source_url: url,
          metadata: { 
            status: 'pending',
            crawl_depth: maxDepth
          }
        })
        .select()
        .single();

      if (docError) {
        throw docError;
      }

      // 3. Start crawling process
      const crawlResponse = await fetch('/api/kb/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: docData.id,
          url,
          maxDepth
        })
      });

      if (!crawlResponse.ok) {
        throw new Error('Failed to start crawling');
      }

      setSuccessMsg('Website crawling has begun');
      
      // Clear form
      setUrl('');
      setTitle('');
      setDescription('');
      setMaxDepth(2);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/knowledge-base?highlight=' + docData.id);
      }, 2000);

    } catch (err: any) {
      console.error('Crawl error:', err);
      setErrorMsg(err.message || 'Failed to start crawling');
    } finally {
      setIsCrawling(false);
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

        <form onSubmit={handleCrawl} className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="https://example.com"
              disabled={isCrawling}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter a title for this website content"
              disabled={isCrawling}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows={4}
              placeholder="Enter a description of what content you expect to gather"
              disabled={isCrawling}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Maximum Crawl Depth
            </label>
            <select
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              disabled={isCrawling}
            >
              <option value={1}>1 - Homepage only</option>
              <option value={2}>2 - Homepage + direct links</option>
              <option value={3}>3 - Homepage + two levels deep</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Higher depth values will take longer to process
            </p>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isCrawling}
              className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                isCrawling ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isCrawling ? 'Starting Crawler...' : 'Start Crawling'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 