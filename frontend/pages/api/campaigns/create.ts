import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../backend/src/config/supabaseAdmin';
import { getUserOrgId } from '../../../../backend/src/services/authService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { name, description, queries } = req.body;

  if (!name || !description || !Array.isArray(queries) || queries.length === 0) {
    return res.status(400).send('Missing required fields');
  }

  try {
    // In a real app, we'd get the user ID from the session
    // For now, we'll use a dummy user ID as in Step 3
    const userId = 'abc-123';
    
    const orgId = await getUserOrgId(userId);
    if (!orgId) {
      return res.status(400).send('No organization found for user');
    }

    // Create the campaign
    const { data: campaign, error: insertError } = await supabaseAdmin
      .from('outreach_campaigns')
      .insert({
        org_id: orgId,
        name,
        description,
        status: 'draft',
        metadata: { queries }
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating campaign:', insertError);
      return res.status(400).send(insertError.message);
    }

    console.log(`Created campaign ${campaign.id} for org ${orgId}`);
    return res.status(200).json({ id: campaign.id });
  } catch (err: any) {
    console.error('Error in campaign creation:', err);
    return res.status(500).send(err.message || String(err));
  }
} 