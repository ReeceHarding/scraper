import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../backend/src/config/supabaseAdmin';
import { embeddingQueue } from '../../../../backend/src/workers/embeddingWorker';
import { logger } from '../../../../backend/src/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { title, description, filePath } = req.body;
  if (!title || !description || !filePath) {
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

    // Insert knowledge doc
    const { data: doc, error: docError } = await supabaseAdmin
      .from('knowledge_docs')
      .insert({
        org_id: profile.org_id,
        title,
        description,
        file_path: filePath,
        metadata: {
          status: 'pending',
          uploaded_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (docError) {
      logger.error('Error inserting knowledge doc:', docError);
      return res.status(500).send('Failed to create document record');
    }

    // Queue embedding job
    await embeddingQueue.add('embedDoc', {
      docId: doc.id,
      orgId: profile.org_id,
      filePath
    });

    logger.info(`Document ${doc.id} created and queued for embedding`);
    return res.status(200).json(doc);
  } catch (err: any) {
    logger.error('Error in insertDoc:', err);
    return res.status(500).send(err.message || 'Internal server error');
  }
} 