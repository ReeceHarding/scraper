import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Initialize Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize embedding queue
const embeddingQueue = new Queue('embedding', {
  connection: redis
});

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
    const { user } = await supabaseAdmin.auth.getUser(req.headers.authorization?.split(' ')[1] || '');
    
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user's org_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile?.org_id) {
      return res.status(400).json({ error: 'User has no organization' });
    }

    // Insert document
    const { data: doc, error: insertError } = await supabaseAdmin
      .from('knowledge_docs')
      .insert({
        org_id: profile.org_id,
        title,
        description,
        file_path: filePath
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting document:', insertError);
      return res.status(500).json({ error: 'Failed to insert document' });
    }

    // Queue document for processing
    await embeddingQueue.add('process_document', {
      docId: doc.id,
      filePath,
      orgId: profile.org_id
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });

    return res.status(200).json(doc);
  } catch (error: any) {
    console.error('Error in insertDoc:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 