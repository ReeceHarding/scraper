import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabaseClient } from '../../../lib/supabaseClient';

interface Template {
  id: string;
  campaign_id: string;
  name: string;
  subject: string;
  body: string;
  metadata: {
    variables?: string[];
    version?: number;
    last_edited?: string;
  };
  created_at: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const { id: campaignId } = router.query;
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    if (campaignId) {
      loadTemplates();
    }
  }, [campaignId]);

  async function loadTemplates() {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('email_templates')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const variables = extractVariables(formData.body);
      const template = {
        campaign_id: campaignId,
        name: formData.name,
        subject: formData.subject,
        body: formData.body,
        metadata: {
          variables,
          version: 1,
          last_edited: new Date().toISOString()
        }
      };

      if (editingTemplate) {
        const { error } = await supabaseClient
          .from('email_templates')
          .update({
            ...template,
            metadata: {
              ...template.metadata,
              version: (editingTemplate.metadata.version || 1) + 1
            }
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabaseClient
          .from('email_templates')
          .insert(template);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingTemplate(null);
      setFormData({ name: '', subject: '', body: '' });
      loadTemplates();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  function extractVariables(text: string): string[] {
    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    return Array.from(new Set(matches.map(m => m.slice(2, -2).trim())));
  }

  function handleEdit(template: Template) {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body
    });
    setShowForm(true);
  }

  async function handleDelete(templateId: string) {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabaseClient
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      loadTemplates();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  function handlePreview(template: Template) {
    // TODO: Show preview with sample data
    alert('Preview functionality coming soon!');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <div className="space-x-4">
          <button
            onClick={() => {
              setEditingTemplate(null);
              setFormData({ name: '', subject: '', body: '' });
              setShowForm(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create Template
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Back to Campaign
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingTemplate ? 'Edit Template' : 'Create Template'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Initial Outreach"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Quick question about {{company_name}}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Body
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Hi {{first_name}},

I noticed that {{company_name}} is doing great work in {{industry}}..."
              />
            </div>
            <div className="text-sm text-gray-500">
              Available variables: {`{{first_name}}, {{last_name}}, {{company_name}}, {{industry}}`}, etc.
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTemplate(null);
                  setFormData({ name: '', subject: '', body: '' });
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                {editingTemplate ? 'Update Template' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-8">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No templates yet. Create your first one!
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  <p className="text-sm text-gray-500">
                    Last edited: {new Date(template.metadata.last_edited || template.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handlePreview(template)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Subject: </span>
                  <span className="text-gray-700">{template.subject}</span>
                </div>
                <div>
                  <span className="font-medium">Body:</span>
                  <pre className="mt-1 whitespace-pre-wrap text-gray-700 font-sans">
                    {template.body}
                  </pre>
                </div>
                {template.metadata.variables && template.metadata.variables.length > 0 && (
                  <div className="text-sm text-gray-500">
                    Variables used: {template.metadata.variables.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 