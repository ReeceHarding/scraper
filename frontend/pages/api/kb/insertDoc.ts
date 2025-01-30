import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../backend/src/config/supabaseAdmin';
import { enqueueEmbeddingJob } from '../../../../backend/src/queues/embeddingQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { title, description, filePath } = req.body;
    if (!title || !description || !filePath) {
      return res.status(400).send('Missing required fields');
    }

    // Get user from session
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(req.headers.authorization?.split(' ')[1] || '');
    if (authError || !user) {
      return res.status(401).send('Not authenticated');
    }

    // Get user's org_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile?.org_id) {
      return res.status(400).send('User has no organization');
    }

    // Insert document
    const { data: doc, error: insertError } = await supabaseAdmin
      .from('knowledge_docs')
      .insert({
        org_id: profile.org_id,
        title,
        description,
        file_path: filePath,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[KB] Error inserting document:', insertError);
      return res.status(500).send('Failed to insert document');
    }

    // Enqueue embedding job
    await enqueueEmbeddingJob({
      docId: doc.id,
      orgId: profile.org_id,
      filePath,
    });

    console.log(`[KB] Document ${doc.id} created and embedding job enqueued`);
    return res.status(200).json(doc);
  } catch (error) {
    console.error('[KB] Error in insertDoc:', error);
    return res.status(500).send('Internal server error');
  }
} 