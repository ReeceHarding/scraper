import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabaseClient } from '../../../lib/supabaseClient';

interface Contact {
  id: string;
  company_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  metadata: {
    linkedin_url?: string;
    location?: string;
  };
  created_at: string;
  company: {
    name: string;
    domain: string;
  };
}

export default function ContactsPage() {
  const router = useRouter();
  const { id: campaignId } = router.query;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'email' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    if (campaignId) {
      loadContacts();
    }
  }, [campaignId, page, searchTerm, sortBy, sortOrder]);

  async function loadContacts() {
    try {
      setLoading(true);
      let query = supabaseClient
        .from('outreach_contacts')
        .select(`
          *,
          company:outreach_companies(name, domain)
        `)
        .eq('campaign_id', campaignId)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setContacts(data || []);
      setHasMore(data?.length === ITEMS_PER_PAGE);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSort(field: typeof sortBy) {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  }

  function getSortIcon(field: typeof sortBy) {
    if (field !== sortBy) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  }

  function toggleSelectAll() {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    }
  }

  function toggleContact(id: string) {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContacts(newSelected);
  }

  async function exportContacts() {
    const contactsToExport = contacts.filter(c => selectedContacts.has(c.id));
    const csvContent = [
      ['Email', 'First Name', 'Last Name', 'Title', 'Company', 'Domain', 'LinkedIn', 'Location'].join(','),
      ...contactsToExport.map(c => [
        c.email,
        c.first_name || '',
        c.last_name || '',
        c.title || '',
        c.company.name || '',
        c.company.domain || '',
        c.metadata.linkedin_url || '',
        c.metadata.location || ''
      ].map(field => `"${field.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contacts_export_${new Date().toISOString()}.csv`;
    link.click();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <div className="space-x-4">
          <button
            onClick={exportContacts}
            disabled={selectedContacts.size === 0}
            className={`px-4 py-2 rounded ${
              selectedContacts.size === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            Export Selected ({selectedContacts.size})
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Back to Campaign
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedContacts.size === contacts.length && contacts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('email')}
                >
                  Contact {getSortIcon('email')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  Found {getSortIcon('created_at')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {contact.first_name && contact.last_name
                        ? `${contact.first_name} ${contact.last_name}`
                        : contact.email}
                    </div>
                    <div className="text-sm text-gray-500">{contact.email}</div>
                    {contact.metadata.linkedin_url && (
                      <a
                        href={contact.metadata.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        LinkedIn Profile ↗
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contact.title || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {contact.company.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">{contact.company.domain}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contact.metadata.location || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && contacts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No contacts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              page === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasMore}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              !hasMore
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
} 