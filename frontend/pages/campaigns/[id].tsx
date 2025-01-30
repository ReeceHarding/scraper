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
    processed_companies?: number;
    error?: string;
    completed_at?: string;
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
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadCampaignData();
    const interval = setInterval(loadCampaignData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [id]);

  async function loadCampaignData() {
    try {
      // Load campaign
      const { data: campaignData, error: campaignError } = await supabaseClient
        .from('outreach_campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campaignError) {
        setErrorMsg(campaignError.message);
        return;
      }

      setCampaign(campaignData);

      // Load companies
      const { data: companiesData, error: companiesError } = await supabaseClient
        .from('outreach_companies')
        .select('*')
        .eq('campaign_id', id);

      if (companiesError) {
        setErrorMsg(companiesError.message);
        return;
      }

      setCompanies(companiesData);

      // Load contacts
      const { data: contactsData, error: contactsError } = await supabaseClient
        .from('outreach_contacts')
        .select('*')
        .eq('campaign_id', id);

      if (contactsError) {
        setErrorMsg(contactsError.message);
        return;
      }

      setContacts(contactsData);
      setIsLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    }
  }

  async function handleActivate() {
    setErrorMsg('');
    try {
      const resp = await fetch(`/api/campaigns/activate?id=${id}`, { method: 'POST' });
      if (!resp.ok) {
        const txt = await resp.text();
        setErrorMsg(txt);
      } else {
        await loadCampaignData(); // Refresh data immediately
      }
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    }
  }

  if (isLoading || !campaign) return <div>Loading... {errorMsg}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Campaign: {campaign.name}</h1>
      
      {/* Campaign Info */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-xl font-semibold mb-2">Campaign Details</h2>
        <p><strong>Description:</strong> {campaign.description}</p>
        <p><strong>Status:</strong> {campaign.status}</p>
        <p><strong>Created:</strong> {new Date(campaign.created_at).toLocaleString()}</p>
        
        {/* Scraping Status */}
        {campaign.metadata?.scraping_status && (
          <div className="mt-2">
            <p><strong>Scraping Status:</strong> {campaign.metadata.scraping_status}</p>
            {campaign.metadata.current_query && (
              <p><strong>Current Query:</strong> {campaign.metadata.current_query}</p>
            )}
            {campaign.metadata.processed_companies !== undefined && (
              <p><strong>Companies Processed:</strong> {campaign.metadata.processed_companies}</p>
            )}
            {campaign.metadata.completed_at && (
              <p><strong>Completed At:</strong> {new Date(campaign.metadata.completed_at).toLocaleString()}</p>
            )}
            {campaign.metadata.error && (
              <p className="text-red-500"><strong>Error:</strong> {campaign.metadata.error}</p>
            )}
          </div>
        )}

        {/* Activation Button */}
        {campaign.status === 'draft' && (
          <button
            onClick={handleActivate}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Activate & Start Scraping
          </button>
        )}
      </div>

      {/* Search Queries */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-xl font-semibold mb-2">Search Queries</h2>
        <ul className="list-disc pl-4">
          {campaign.metadata?.queries?.map((query, idx) => (
            <li key={idx}>{query}</li>
          ))}
        </ul>
      </div>

      {/* Companies */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-xl font-semibold mb-2">Companies ({companies.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Industry</th>
                <th className="px-4 py-2">Size</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(company => (
                <tr key={company.id} className="border-t">
                  <td className="px-4 py-2">{company.name}</td>
                  <td className="px-4 py-2">{company.metadata?.industry || '-'}</td>
                  <td className="px-4 py-2">{company.metadata?.size || '-'}</td>
                  <td className="px-4 py-2">{company.metadata?.location || '-'}</td>
                  <td className="px-4 py-2">
                    <a
                      href={company.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      View on LinkedIn
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-2">Contacts ({contacts.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(contact => (
                <tr key={contact.id} className="border-t">
                  <td className="px-4 py-2">{contact.name}</td>
                  <td className="px-4 py-2">{contact.title}</td>
                  <td className="px-4 py-2">{contact.email}</td>
                  <td className="px-4 py-2">{contact.metadata?.location || '-'}</td>
                  <td className="px-4 py-2">
                    <a
                      href={contact.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      View on LinkedIn
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          {errorMsg}
        </div>
      )}
    </div>
  );
} 