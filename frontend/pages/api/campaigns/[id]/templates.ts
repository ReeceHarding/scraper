import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, getUserOrgId, fetchUserIdFromCookieOrSession } from '../../../../../backend/src/config/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: campaignId } = req.query;
  if (!campaignId) return res.status(400).send('Missing campaign ID');

  try {
    // Verify user has access to this campaign
    const userId = await fetchUserIdFromCookieOrSession(req);
    if (!userId) return res.status(401).send('Not logged in');
    const orgId = await getUserOrgId(userId);
    if (!orgId) return res.status(400).send('No org found');

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('outreach_campaigns')
      .select('org_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).send('Campaign not found');
    }

    if (campaign.org_id !== orgId) {
      return res.status(403).send('Not authorized to access this campaign');
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        const { data: templates, error: getError } = await supabaseAdmin
          .from('email_templates')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false });

        if (getError) throw getError;
        return res.status(200).json(templates);

      case 'POST':
        const { name, subject, body } = req.body;
        if (!name || !subject || !body) {
          return res.status(400).send('Missing required fields');
        }

        const variables = extractVariables(body);
        const { data: newTemplate, error: createError } = await supabaseAdmin
          .from('email_templates')
          .insert({
            campaign_id: campaignId,
            name,
            subject,
            body,
            metadata: {
              variables,
              version: 1,
              last_edited: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (createError) throw createError;
        return res.status(201).json(newTemplate);

      case 'PUT':
        const { id: templateId, ...updateData } = req.body;
        if (!templateId) return res.status(400).send('Missing template ID');

        const variables2 = extractVariables(updateData.body);
        const { data: template, error: templateError } = await supabaseAdmin
          .from('email_templates')
          .select('metadata')
          .eq('id', templateId)
          .eq('campaign_id', campaignId)
          .single();

        if (templateError) throw templateError;

        const { data: updatedTemplate, error: updateError } = await supabaseAdmin
          .from('email_templates')
          .update({
            ...updateData,
            metadata: {
              ...template.metadata,
              variables: variables2,
              version: (template.metadata.version || 1) + 1,
              last_edited: new Date().toISOString()
            }
          })
          .eq('id', templateId)
          .eq('campaign_id', campaignId)
          .select()
          .single();

        if (updateError) throw updateError;
        return res.status(200).json(updatedTemplate);

      case 'DELETE':
        const { templateId: deleteId } = req.query;
        if (!deleteId) return res.status(400).send('Missing template ID');

        const { error: deleteError } = await supabaseAdmin
          .from('email_templates')
          .delete()
          .eq('id', deleteId)
          .eq('campaign_id', campaignId);

        if (deleteError) throw deleteError;
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).send('Method not allowed');
    }
  } catch (err: any) {
    console.error('Error in templates API:', err);
    return res.status(500).send(err.message || String(err));
  }
}

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
  return Array.from(new Set(matches.map(m => m.slice(2, -2).trim())));
} 