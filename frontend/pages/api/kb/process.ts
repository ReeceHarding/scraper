import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { docId } = req.body;

    if (!docId) {
      return res.status(400).json({ error: 'Missing docId' });
    }

    // Verify the document exists and get its details
    const { data: doc, error: docError } = await supabaseAdmin
      .from('knowledge_docs')
      .select('*')
      .eq('id', docId)
      .single();

    if (docError || !doc) {
      console.error('Error fetching document:', docError);
      return res.status(404).json({ error: 'Document not found' });
    }

    // Add job to embedding queue
    await redis.lpush('embedding:queue', JSON.stringify({
      id: docId,
      file_path: doc.file_path,
      metadata: doc.metadata
    }));

    console.log(`Added document ${docId} to embedding queue`);

    return res.status(200).json({ message: 'Document queued for processing' });
  } catch (error: any) {
    console.error('Error processing document:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 