import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../backend/src/config/supabaseAdmin';
import { getUserOrgId } from '../../../../backend/src/services/authService';
import { enqueueCrawlJob } from '../../../../backend/src/queues/crawlQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { url, maxDepth, maxPages } = req.body;
  if (!url) {
    return res.status(400).send('Missing URL');
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(
      req.headers.authorization?.split(' ')[1] || ''
    );

    if (authError || !authData?.user) {
      return res.status(401).send('Not logged in');
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('org_id')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile?.org_id) {
      return res.status(400).send('No org found');
    }

    // Insert initial document
    const { data: doc, error: insertError } = await supabaseAdmin
      .from('knowledge_docs')
      .insert({
        org_id: profile.org_id,
        title: `Crawl of ${url}`,
        description: `Content crawled from ${url}`,
        source_url: url,
        metadata: { status: 'crawling', maxDepth, maxPages }
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).send(`Failed to create document: ${insertError.message}`);
    }

    // Queue crawl job
    await enqueueCrawlJob(
      profile.org_id,
      url,
      `Crawl of ${url}`,
      `Content crawled from ${url}`
    );

    return res.status(200).json(doc);
  } catch (err: any) {
    console.error('Error in crawl endpoint:', err);
    return res.status(500).send(err.message || String(err));
  }
} 