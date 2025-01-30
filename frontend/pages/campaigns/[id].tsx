import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadCampaign();
  }, [id]);

  async function loadCampaign() {
    try {
      const { data, error } = await supabaseClient
        .from('outreach_campaigns')
        .select(`
          *,
          outreach_companies (
            id,
            domain,
            status,
            outreach_contacts (
              id,
              email,
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        setErrorMsg(error.message);
      } else {
        setCampaign(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    } finally {
      setIsLoading(false);
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
        alert('Campaign activated. Scraping job enqueued.');
        loadCampaign(); // Reload to show updated status
      }
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    }
  }

  if (isLoading) return (
    <div className="container mx-auto p-4">
      <p>Loading campaign details...</p>
    </div>
  );

  if (!campaign) return (
    <div className="container mx-auto p-4">
      <p className="text-red-500">{errorMsg || 'Campaign not found'}</p>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{campaign.name}</h1>
        <p className="text-gray-600 mt-2">{campaign.description}</p>
        <div className="mt-4 flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
            campaign.status === 'active' ? 'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {campaign.status}
          </span>
          {campaign.status === 'draft' && (
            <button
              onClick={handleActivate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Activate & Start Scraping
            </button>
          )}
        </div>
      </div>

      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Search Queries</h2>
        <ul className="list-disc pl-5 space-y-1">
          {campaign.metadata?.queries?.map((query: string, idx: number) => (
            <li key={idx} className="text-gray-700">{query}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Companies & Contacts</h2>
        {campaign.outreach_companies && campaign.outreach_companies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacts
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaign.outreach_companies.map((company: any) => (
                  <tr key={company.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {company.domain}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        company.status === 'scraped' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {company.outreach_contacts?.map((contact: any) => (
                        <div key={contact.id} className="text-sm">
                          {contact.name} ({contact.email})
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No companies found yet. Activate the campaign to start scraping.</p>
        )}
      </div>
    </div>
  );
} 