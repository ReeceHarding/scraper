import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../backend/src/config/supabaseAdmin';
import { getUserOrgId } from '../../../../backend/src/services/authService';
import { embeddingQueue } from '../../../../backend/src/workers/embeddingWorker';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { offerText } = req.body;
  if (!offerText) {
    return res.status(400).send('Missing offerText');
  }
  try {
    const userId = await fetchUserIdFromCookieOrSession(req);
    if (!userId) {
      return res.status(401).send('Not logged in');
    }
    const orgId = await getUserOrgId(userId);
    if (!orgId) {
      return res.status(400).send('No org found');
    }

    // Check for existing offer doc
    const existing = await supabaseAdmin
      .from('knowledge_docs')
      .select('id')
      .eq('org_id', orgId)
      .eq('metadata->>is_offer', 'true')
      .single();

    let docId: string;
    if (!existing.error && existing.data) {
      // Update existing
      docId = existing.data.id;
      await supabaseAdmin
        .from('knowledge_docs')
        .update({
          title: 'Hormozi Offer',
          description: 'No-brainer offer text',
          source_url: null,
          file_path: null,
          metadata: { is_offer: true, status: 'pending' }
        })
        .eq('id', docId);
      
      // Delete old chunks
      await supabaseAdmin
        .from('knowledge_doc_chunks')
        .delete()
        .eq('doc_id', docId);
    } else {
      // Insert new
      const insertRes = await supabaseAdmin
        .from('knowledge_docs')
        .insert({
          org_id: orgId,
          title: 'Hormozi Offer',
          description: 'No-brainer offer text',
          metadata: { is_offer: true, status: 'pending' }
        })
        .select('id')
        .single();

      if (insertRes.error) {
        return res.status(400).send(insertRes.error.message);
      }
      docId = insertRes.data.id;
    }

    // Queue embedding job
    await embeddingQueue.add('embeddingJob', {
      docId,
      orgId,
      rawTextOverride: offerText
    });

    return res.status(200).send('Offer saved and embedding queued');
  } catch (err: any) {
    return res.status(500).send(err.message || String(err));
  }
}

async function fetchUserIdFromCookieOrSession(req: NextApiRequest): Promise<string|null> {
  return 'abc-123'; // Using the same stub as in other routes
} 