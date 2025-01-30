import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
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

interface Stats {
  total_companies: number;
  total_contacts: number;
  companies_with_contacts: number;
  avg_contacts_per_company: number;
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadCampaign();
      loadStats();
    }
  }, [id]);

  async function loadCampaign() {
    try {
      const { data, error } = await supabaseClient
        .from('outreach_campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCampaign(data);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      // Get companies count
      const { count: totalCompanies } = await supabaseClient
        .from('outreach_companies')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id);

      // Get contacts count
      const { count: totalContacts } = await supabaseClient
        .from('outreach_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id);

      // Get companies with contacts
      const { count: companiesWithContacts } = await supabaseClient
        .from('outreach_companies')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', id)
        .gt('contact_count', 0);

      setStats({
        total_companies: totalCompanies || 0,
        total_contacts: totalContacts || 0,
        companies_with_contacts: companiesWithContacts || 0,
        avg_contacts_per_company: totalCompanies ? (totalContacts || 0) / totalCompanies : 0
      });
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  }

  async function handleActivate() {
    try {
      const resp = await fetch(`/api/campaigns/activate?id=${id}`, { method: 'POST' });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text);
      }
      loadCampaign(); // Reload to get updated status
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  if (loading) return <div>Loading campaign...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!campaign) return <div>Campaign not found</div>;

  const progress = campaign.metadata.current_query_index !== undefined && campaign.metadata.total_queries
    ? ((campaign.metadata.current_query_index + 1) / campaign.metadata.total_queries) * 100
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
            <p className="text-gray-600">{campaign.description}</p>
          </div>
          {campaign.status === 'draft' && (
            <button
              onClick={handleActivate}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Activate & Start Scraping
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Campaign Status</h2>
            <div className="space-y-4">
              <div>
                <span className="font-medium">Status: </span>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
              </div>
              {campaign.status === 'active' && (
                <>
                  <div>
                    <span className="font-medium">Current Query: </span>
                    {campaign.metadata.current_query || 'Not started'}
                  </div>
                  <div>
                    <span className="font-medium">Progress: </span>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {campaign.metadata.current_query_index !== undefined && campaign.metadata.total_queries
                        ? `Query ${campaign.metadata.current_query_index + 1} of ${campaign.metadata.total_queries}`
                        : 'Not started'
                      }
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Search Queries</h2>
            <div className="space-y-2">
              {campaign.metadata.queries?.map((query, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  {query}
                </div>
              ))}
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Total Companies</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.total_companies}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Total Contacts</h3>
              <p className="text-3xl font-bold text-green-600">{stats.total_contacts}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Companies w/ Contacts</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.companies_with_contacts}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Avg. Contacts/Company</h3>
              <p className="text-3xl font-bold text-orange-600">
                {stats.avg_contacts_per_company.toFixed(1)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => router.push(`/campaigns/${id}/companies`)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          View Companies
        </button>
        <button
          onClick={() => router.push(`/campaigns/${id}/contacts`)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          View Contacts
        </button>
      </div>

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