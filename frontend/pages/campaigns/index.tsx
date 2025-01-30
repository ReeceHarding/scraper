import { useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  metadata: {
    queries?: string[];
    scraping_status?: string;
  };
  created_at: string;
}

export default function CampaignsIndexPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      const { data: userData } = await supabaseClient.auth.getUser();
      if (!userData?.user) {
        setErrorMsg('Not logged in');
        return;
      }

      const { data, error } = await supabaseClient
        .from('outreach_campaigns')
        .select(`
          *,
          outreach_companies:outreach_companies_count (
            count
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMsg(error.message);
      } else if (data) {
        setCampaigns(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <p>Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Link 
          href="/campaigns/new"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Create Campaign
        </Link>
      </div>

      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}

      {campaigns.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first campaign</p>
          <Link
            href="/campaigns/new"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Create Your First Campaign
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <li key={campaign.id}>
                <Link 
                  href={`/campaigns/${campaign.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {campaign.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {campaign.description}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {campaign.status}
                        </span>
                        {campaign.metadata?.scraping_status === 'completed' && (
                          <span className="bg-green-100 text-green-800 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                            Scraping Complete
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {campaign.metadata?.queries?.length || 0} queries
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Created {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 