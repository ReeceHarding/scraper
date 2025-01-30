import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../backend/src/config/supabaseAdmin';
import { embeddingQueue } from '../../../../backend/src/workers/embeddingWorker';
import { logger } from '../../../../backend/src/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { title, description, content } = req.body;
  if (!title || !description || !content) {
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

    // Check if an offer already exists
    const { data: existingOffers } = await supabaseAdmin
      .from('knowledge_docs')
      .select('id')
      .eq('metadata->is_offer', true)
      .eq('org_id', profile.org_id);

    let docId: string;

    if (existingOffers && existingOffers.length > 0) {
      // Update existing offer
      const { data: doc, error: updateError } = await supabaseAdmin
        .from('knowledge_docs')
        .update({
          title,
          description,
          metadata: {
            is_offer: true,
            status: 'pending',
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', existingOffers[0].id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error updating offer:', updateError);
        return res.status(500).send('Failed to update offer');
      }

      docId = doc.id;

      // Delete existing chunks
      await supabaseAdmin
        .from('knowledge_doc_chunks')
        .delete()
        .eq('doc_id', docId);
    } else {
      // Create new offer
      const { data: doc, error: insertError } = await supabaseAdmin
        .from('knowledge_docs')
        .insert({
          org_id: profile.org_id,
          title,
          description,
          metadata: {
            is_offer: true,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Error inserting offer:', insertError);
        return res.status(500).send('Failed to create offer');
      }

      docId = doc.id;
    }

    // Queue embedding job
    await embeddingQueue.add('embedDoc', {
      docId,
      orgId: profile.org_id,
      content
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });

    logger.info(`Offer ${docId} saved and queued for embedding`);
    return res.status(200).json({ docId });
  } catch (err: any) {
    logger.error('Error in saveOffer:', err);
    return res.status(500).send(err.message || 'Internal server error');
  }
} 