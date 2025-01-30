import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { enqueueEmbeddingJob } from '../../../lib/queue';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, description, filePath } = req.body;

    if (!title || !description || !filePath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user from session
    const { user, error: authError } = await supabaseAdmin.auth.getUser(
      req.headers.authorization?.split(' ')[1] || ''
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's org_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.org_id) {
      return res.status(400).json({ error: 'User has no organization' });
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
      console.error('Error inserting document:', insertError);
      return res.status(500).json({ error: 'Failed to insert document' });
    }

    // Queue embedding job
    await enqueueEmbeddingJob({
      docId: doc.id,
      orgId: profile.org_id,
      filePath
    });

    return res.status(200).json(doc);
  } catch (error) {
    console.error('Error in insertDoc:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 