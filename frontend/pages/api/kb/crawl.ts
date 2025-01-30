import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../backend/src/config/supabaseAdmin';
import { crawlQueue } from '../../../../backend/src/workers/crawlWorker';
import { logger } from '../../../../backend/src/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { title, description, sourceUrl, maxPages, maxDepth } = req.body;
  if (!title || !description || !sourceUrl) {
    return res.status(400).send('Missing required fields');
  }

  try {
    // Get user from session
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(req.headers.authorization?.split(' ')[1]);
    if (authError || !user) {
      return res.status(401).send('Not authenticated');
    }

    // Get user's org_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.org_id) {
      return res.status(400).send('User has no organization');
    }

    // Validate URL
    try {
      new URL(sourceUrl);
    } catch {
      return res.status(400).send('Invalid URL');
    }

    // Insert knowledge doc
    const { data: doc, error: docError } = await supabaseAdmin
      .from('knowledge_docs')
      .insert({
        org_id: profile.org_id,
        title,
        description,
        source_url: sourceUrl,
        metadata: {
          status: 'pending',
          created_at: new Date().toISOString(),
          max_pages: maxPages,
          max_depth: maxDepth
        }
      })
      .select()
      .single();

    if (docError) {
      logger.error('Error inserting knowledge doc:', docError);
      return res.status(500).send('Failed to create document record');
    }

    // Queue crawl job
    await crawlQueue.add('crawlDoc', {
      docId: doc.id,
      orgId: profile.org_id,
      sourceUrl,
      maxPages,
      maxDepth
    });

    logger.info(`Document ${doc.id} created and queued for crawling`);
    return res.status(200).json(doc);
  } catch (err: any) {
    logger.error('Error in crawl:', err);
    return res.status(500).send(err.message || 'Internal server error');
  }
} 