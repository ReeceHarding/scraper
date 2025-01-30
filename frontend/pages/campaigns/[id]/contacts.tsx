import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabaseClient } from '../../../lib/supabaseClient';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  company: {
    name: string | null;
    domain: string;
  };
  metadata: {
    linkedin_url?: string;
    location?: string;
  };
  created_at: string;
}

export default function CampaignContactsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalCompanies: 0,
    withLinkedIn: 0,
    withTitle: 0
  });

  useEffect(() => {
    if (!id) return;
    loadContacts();
  }, [id]);

  async function loadContacts() {
    try {
      // Get contacts with their company info
      const { data, error } = await supabaseClient
        .from('outreach_contacts')
        .select(`
          *,
          company:outreach_companies(
            name,
            domain
          )
        `)
        .eq('campaign_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const contacts = data || [];
      const stats = {
        totalContacts: contacts.length,
        totalCompanies: new Set(contacts.map(c => c.company.domain)).size,
        withLinkedIn: contacts.filter(c => c.metadata?.linkedin_url).length,
        withTitle: contacts.filter(c => c.title).length
      };

      setContacts(contacts);
      setStats(stats);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading contacts...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campaign Contacts</h1>
        <button
          onClick={() => router.push(`/campaigns/${id}`)}
          className="text-blue-500 hover:text-blue-600"
        >
          Back to Campaign
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">{stats.totalContacts}</div>
          <div className="text-gray-500">Total Contacts</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">{stats.totalCompanies}</div>
          <div className="text-gray-500">Companies</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">{stats.withLinkedIn}</div>
          <div className="text-gray-500">With LinkedIn</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">{stats.withTitle}</div>
          <div className="text-gray-500">With Title</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Found
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="font-medium text-gray-900">
                      {contact.first_name && contact.last_name
                        ? `${contact.first_name} ${contact.last_name}`
                        : 'Unknown Name'}
                    </div>
                    <div className="text-gray-500">{contact.email}</div>
                    {contact.metadata?.linkedin_url && (
                      <a
                        href={contact.metadata.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 text-sm"
                      >
                        LinkedIn Profile
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="font-medium text-gray-900">
                      {contact.company.name || 'Unknown Company'}
                    </div>
                    <div className="text-gray-500">{contact.company.domain}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {contact.title || '-'}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {contact.metadata?.location || '-'}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(contact.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}

            {contacts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No contacts found yet. The scraping process may still be running.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 