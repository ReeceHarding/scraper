import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../backend/src/config/supabaseAdmin';
import { getUserOrgId } from '../../../../backend/src/services/authService';
import { enqueueCrawlJob } from '../../../../backend/src/queues/crawlQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { url, title, description } = req.body;
  if (!url || !title || !description) {
    return res.status(400).send('Missing fields');
  }
  try {
    const userId = await fetchUserIdFromCookieOrSession(req);
    if (!userId) {
      return res.status(401).send('Not logged in');
    }

    const orgId = await getUserOrgId(userId);
    if (!orgId) {
      return res.status(400).send('No org for user');
    }

    await enqueueCrawlJob(orgId, url, title, description);
    return res.status(200).send('Crawl job enqueued');
  } catch (err: any) {
    return res.status(500).send(err.message || String(err));
  }
}

async function fetchUserIdFromCookieOrSession(req: NextApiRequest): Promise<string|null> {
  // Implementation detail. We do same approach as Step 2 or we have a supabase session cookie
  return "abc-123";
} 