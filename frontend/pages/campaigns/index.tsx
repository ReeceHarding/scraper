import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabaseClient } from '../../lib/supabaseClient';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  metadata: {
    queries?: string[];
    scraping_status?: string;
    current_query?: string;
    current_query_index?: number;
    total_queries?: number;
    last_updated?: string;
  };
  created_at: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      const { data, error } = await supabaseClient
        .from('outreach_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function getStatusDisplay(campaign: Campaign) {
    if (campaign.status === 'active') {
      const { scraping_status, current_query_index, total_queries } = campaign.metadata;
      if (scraping_status === 'in_progress') {
        return `Scraping (${current_query_index! + 1}/${total_queries})`;
      }
      return 'Active';
    }
    return campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1);
  }

  if (loading) return <div>Loading campaigns...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <button
          onClick={() => router.push('/campaigns/new')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No campaigns yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              onClick={() => router.push(`/campaigns/${campaign.id}`)}
              className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{campaign.name}</h2>
                  <p className="text-gray-600 mb-4">{campaign.description}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getStatusDisplay(campaign)}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Queries: </span>
                  {campaign.metadata.queries?.length || 0}
                </div>
                <div>
                  <span className="font-medium">Created: </span>
                  {new Date(campaign.created_at).toLocaleDateString()}
                </div>
                {campaign.metadata.last_updated && (
                  <div className="col-span-2">
                    <span className="font-medium">Last Updated: </span>
                    {new Date(campaign.metadata.last_updated).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .error {
          color: red;
          padding: 1rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
} 