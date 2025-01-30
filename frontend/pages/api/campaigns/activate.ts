import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../backend/src/config/supabaseAdmin';
import { scrapeQueue } from '../../../../backend/src/workers/scrapeWorker';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { id } = req.query;
  if (!id) return res.status(400).send('Missing id');
  
  try {
    const upd = await supabaseAdmin
      .from('outreach_campaigns')
      .update({ status: 'active' })
      .eq('id', id)
      .select('metadata, org_id')
      .single();
    
    if (upd.error) return res.status(400).send(upd.error.message);
    
    const queries = upd.data.metadata?.queries || [];
    const orgId = upd.data.org_id;
    
    await scrapeQueue.add('scrapeJob', {
      campaignId: id,
      orgId,
      queries
    });
    
    return res.status(200).send('Campaign activated, scraping enqueued');
  } catch (err: any) {
    return res.status(500).send(err.message || String(err));
  }
} 