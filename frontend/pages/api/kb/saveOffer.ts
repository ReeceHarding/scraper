import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../backend/src/config/supabaseAdmin';
import { enqueueEmbeddingJob } from '../../../../backend/src/queues/embeddingQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { offerText } = req.body;
    if (!offerText?.trim()) {
      return res.status(400).send('Offer text is required');
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

    // Check if an offer doc already exists
    const { data: existingOffer } = await supabaseAdmin
      .from('knowledge_docs')
      .select('id')
      .eq('org_id', profile.org_id)
      .eq('metadata->is_offer', true)
      .single();

    let docId: string;

    if (existingOffer) {
      // Update existing offer
      const { data: updatedDoc, error: updateError } = await supabaseAdmin
        .from('knowledge_docs')
        .update({
          description: 'Updated Hormozi-style offer',
          metadata: {
            is_offer: true,
            status: 'pending',
            content: offerText
          }
        })
        .eq('id', existingOffer.id)
        .select()
        .single();

      if (updateError) {
        console.error('[KB] Error updating offer:', updateError);
        return res.status(500).send('Failed to update offer');
      }

      docId = existingOffer.id;

      // Delete existing chunks
      await supabaseAdmin
        .from('knowledge_doc_chunks')
        .delete()
        .eq('doc_id', docId);

    } else {
      // Create new offer doc
      const { data: newDoc, error: insertError } = await supabaseAdmin
        .from('knowledge_docs')
        .insert({
          org_id: profile.org_id,
          title: 'Hormozi-Style Offer',
          description: 'Your no-brainer offer',
          metadata: {
            is_offer: true,
            status: 'pending',
            content: offerText
          }
        })
        .select()
        .single();

      if (insertError) {
        console.error('[KB] Error creating offer:', insertError);
        return res.status(500).send('Failed to create offer');
      }

      docId = newDoc.id;
    }

    // Enqueue embedding job
    await enqueueEmbeddingJob({
      docId,
      orgId: profile.org_id,
      content: offerText
    });

    console.log(`[KB] Offer ${docId} saved and embedding job enqueued`);
    return res.status(200).json({ docId });

  } catch (error: any) {
    console.error('[KB] Error in saveOffer:', error);
    return res.status(500).json({ error: error.message });
  }
} 