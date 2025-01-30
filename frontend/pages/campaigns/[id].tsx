import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  metadata: {
    queries: string[];
  };
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  linkedin_url: string;
  description: string;
  metadata: {
    industry?: string;
    size?: string;
    location?: string;
  };
}

interface Contact {
  id: string;
  name: string;
  title: string;
  linkedin_url: string;
  email: string;
  metadata: {
    location?: string;
    connections?: string;
  };
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchCampaign() {
      try {
        const { data, error } = await supabaseClient
          .from('outreach_campaigns')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          setError(error.message);
        } else {
          setCampaign(data);
        }
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchCampaign();
  }, [id]);

  async function handleActivate() {
    if (!campaign || activating) return;

    setActivating(true);
    setError('');

    try {
      const resp = await fetch(`/api/campaigns/activate?id=${campaign.id}`, {
        method: 'POST'
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text);
      }

      // Refresh campaign data
      const { data, error } = await supabaseClient
        .from('outreach_campaigns')
        .select('*')
        .eq('id', campaign.id)
        .single();

      if (error) {
        throw error;
      }

      setCampaign(data);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setActivating(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Campaign not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-sm text-gray-500">Created {new Date(campaign.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/campaigns/${campaign.id}/contacts`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Contacts
            </button>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
              ${campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}
            >
              {campaign.status}
            </span>
          </div>
        </div>

        <div className="prose max-w-none mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
          <p className="text-gray-700">{campaign.description}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Search Queries</h2>
          <div className="space-y-2">
            {campaign.metadata.queries.map((query, idx) => (
              <div key={idx} className="bg-gray-50 px-4 py-2 rounded-md text-gray-700">
                {query}
              </div>
            ))}
          </div>
        </div>

        {campaign.status === 'draft' && (
          <div className="border-t pt-4">
            <button
              onClick={handleActivate}
              disabled={activating}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                ${activating ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {activating ? 'Activating...' : 'Activate Campaign'}
            </button>
            {error && (
              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 