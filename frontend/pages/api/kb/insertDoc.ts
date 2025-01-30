import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Initialize Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

// Initialize embedding queue
const embeddingQueue = new Queue('embedding', {
  connection: redis
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { title, description, filePath } = req.body;
    if (!title || !description || !filePath) {
      return res.status(400).send('Missing required fields');
    }

    // Get user from Supabase auth
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send('No authorization header');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.split(' ')[1]);
    
    if (authError || !user) {
      return res.status(401).send('Unauthorized');
    }

    // Get user's org_id from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.org_id) {
      return res.status(400).send('User has no organization');
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
      return res.status(500).send('Failed to insert document');
    }

    // Queue embedding job
    await embeddingQueue.add('process_document', {
      docId: doc.id,
      orgId: profile.org_id,
      filePath
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
    return res.status(500).send(error.message || 'Internal Server Error');
  }
} 