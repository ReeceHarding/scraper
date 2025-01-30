import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../backend/src/config/supabaseAdmin';
import { scrapeQueue } from '../../../../backend/src/queues/scrapeQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).send('Missing campaign ID');
  }

  try {
    // Get campaign data and update status
    const { data: campaign, error: updateError } = await supabaseAdmin
      .from('outreach_campaigns')
      .update({ status: 'active' })
      .eq('id', id)
      .select('metadata, org_id')
      .single();

    if (updateError) {
      console.error('Error updating campaign:', updateError);
      return res.status(400).send(updateError.message);
    }

    if (!campaign) {
      return res.status(404).send('Campaign not found');
    }

    const queries = campaign.metadata?.queries || [];
    if (queries.length === 0) {
      return res.status(400).send('No search queries found in campaign');
    }

    // Queue scraping job
    await scrapeQueue.add('scrapeJob', {
      campaignId: id,
      orgId: campaign.org_id,
      queries
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });

    console.log(`Activated campaign ${id} and queued scraping job`);
    return res.status(200).json({ message: 'Campaign activated and scraping job queued' });
  } catch (err: any) {
    console.error('Error activating campaign:', err);
    return res.status(500).send(err.message || String(err));
  }
} 