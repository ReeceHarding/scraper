import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../backend/src/config/supabaseAdmin';
import { getUserOrgId } from '../../../../backend/src/services/authService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { name, description, queries } = req.body;
  if (!name || !description || !Array.isArray(queries) || queries.length === 0) {
    return res.status(400).send('Invalid fields');
  }
  try {
    const userId = await fetchUserIdFromCookieOrSession(req);
    if (!userId) return res.status(401).send('Not logged in');
    const orgId = await getUserOrgId(userId);
    if (!orgId) return res.status(400).send('No org found');
    
    const ins = await supabaseAdmin
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
    
    if (ins.error) return res.status(400).send(ins.error.message);
    return res.status(200).send('Campaign created');
  } catch(err: any) {
    return res.status(500).send(err.message || String(err));
  }
}

async function fetchUserIdFromCookieOrSession(req: NextApiRequest): Promise<string|null> {
  return 'abc-123'; // Using the same stub as in other routes
} 