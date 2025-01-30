import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../backend/src/config/supabaseAdmin';
import { embeddingQueue } from '../../../../backend/src/workers/embeddingWorker';
import { logger } from '../../../../backend/src/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { title, description, content, existingId } = req.body;
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

    let doc;

    if (existingId) {
      // Update existing offer
      const { data: updatedDoc, error: updateError } = await supabaseAdmin
        .from('knowledge_docs')
        .update({
          title,
          description,
          content,
          metadata: {
            type: 'hormozi_offer',
            status: 'pending',
            last_updated: new Date().toISOString()
          }
        })
        .eq('id', existingId)
        .eq('metadata->type', 'hormozi_offer')
        .select()
        .single();

      if (updateError) {
        logger.error('Error updating offer:', updateError);
        return res.status(500).send('Failed to update offer');
      }

      doc = updatedDoc;
    } else {
      // Create new offer
      const { data: newDoc, error: insertError } = await supabaseAdmin
        .from('knowledge_docs')
        .insert({
          org_id: profile.org_id,
          title,
          description,
          content,
          metadata: {
            type: 'hormozi_offer',
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

      doc = newDoc;
    }

    // Queue embedding job
    await embeddingQueue.add('embedDoc', {
      docId: doc.id,
      orgId: profile.org_id,
      content,
      isOffer: true
    });

    logger.info(`Offer ${doc.id} saved and queued for embedding`);
    return res.status(200).json(doc);
  } catch (err: any) {
    logger.error('Error in saveOffer:', err);
    return res.status(500).send(err.message || 'Internal server error');
  }
} 