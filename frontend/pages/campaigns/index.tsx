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
    completed_at?: string;
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

  function getStatusColor(status: string, scrapingStatus?: string) {
    if (status === 'draft') return 'gray';
    if (status === 'active') {
      if (scrapingStatus === 'completed') return 'green';
      if (scrapingStatus === 'failed') return 'red';
      return 'blue';
    }
    return 'gray';
  }

  function getStatusText(campaign: Campaign) {
    if (campaign.status === 'draft') return 'Draft';
    if (campaign.status === 'active') {
      const { scraping_status, current_query_index, total_queries } = campaign.metadata;
      if (scraping_status === 'completed') return 'Completed';
      if (scraping_status === 'failed') return 'Failed';
      if (scraping_status === 'in_progress' && current_query_index !== undefined && total_queries) {
        return `Processing Query ${current_query_index + 1}/${total_queries}`;
      }
      return 'Active';
    }
    return campaign.status;
  }

  if (loading) return <div>Loading campaigns...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <button
          onClick={() => router.push('/campaigns/new')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Campaign
        </button>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            onClick={() => router.push(`/campaigns/${campaign.id}`)}
            className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{campaign.name}</h2>
                <p className="text-gray-600 mt-1">{campaign.description}</p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-${getStatusColor(campaign.status, campaign.metadata.scraping_status)}-500`}
              >
                {getStatusText(campaign)}
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              <div className="flex gap-4">
                <div>
                  <span className="font-medium">Queries:</span>{' '}
                  {campaign.metadata.queries?.length || 0}
                </div>
                {campaign.metadata.current_query && (
                  <div>
                    <span className="font-medium">Current Query:</span>{' '}
                    {campaign.metadata.current_query}
                  </div>
                )}
                {campaign.metadata.completed_at && (
                  <div>
                    <span className="font-medium">Completed:</span>{' '}
                    {new Date(campaign.metadata.completed_at).toLocaleString()}
                  </div>
                )}
                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/campaigns/${campaign.id}/contacts`);
                    }}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    View Contacts
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No campaigns yet. Click "Create Campaign" to get started.
          </div>
        )}
      </div>
    </div>
  );
} 