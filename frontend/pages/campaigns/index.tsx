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
    current_query?: string;
    processed_companies?: number;
    error?: string;
    completed_at?: string;
  };
  created_at: string;
  outreach_companies_count: number;
  outreach_contacts_count: number;
}

export default function CampaignsIndexPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
    const interval = setInterval(loadCampaigns, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
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
          outreach_companies_count:outreach_companies (count),
          outreach_contacts_count:outreach_contacts (count)
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Link
          href="/campaigns/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Campaign
        </Link>
      </div>

      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Progress</th>
              <th className="px-4 py-2 text-left">Companies</th>
              <th className="px-4 py-2 text-left">Contacts</th>
              <th className="px-4 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(campaign => (
              <tr key={campaign.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="text-blue-500 hover:text-blue-600 font-medium"
                  >
                    {campaign.name}
                  </Link>
                  <p className="text-sm text-gray-500">{campaign.description}</p>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    campaign.status === 'draft'
                      ? 'bg-gray-100 text-gray-800'
                      : campaign.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {campaign.metadata?.scraping_status ? (
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        campaign.metadata.scraping_status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : campaign.metadata.scraping_status === 'complete'
                          ? 'bg-green-100 text-green-800'
                          : campaign.metadata.scraping_status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.metadata.scraping_status}
                      </span>
                      {campaign.metadata.current_query && (
                        <p className="text-sm text-gray-500 mt-1">
                          Query: {campaign.metadata.current_query}
                        </p>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-2">
                  <span className="text-gray-900 font-medium">
                    {campaign.outreach_companies_count}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="text-gray-900 font-medium">
                    {campaign.outreach_contacts_count}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {new Date(campaign.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No campaigns yet. Create your first campaign to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 