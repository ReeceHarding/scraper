import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../backend/src/config/supabaseAdmin';
import { enqueueEmbeddingJob } from '../../../../../backend/src/queues/embeddingQueue';
import handler from '../saveOffer';

// Mock dependencies
vi.mock('../../../../../backend/src/config/supabaseAdmin', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}));

vi.mock('../../../../../backend/src/queues/embeddingQueue', () => ({
  enqueueEmbeddingJob: vi.fn()
}));

describe('saveOffer API', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  const mockUser = { id: 'user-123' };
  const mockOrgId = 'org-123';

  beforeEach(() => {
    mockReq = {
      method: 'POST',
      body: { offerText: 'Test offer' },
      headers: { authorization: 'Bearer token-123' }
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn()
    } as unknown as Partial<NextApiResponse>;

    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock responses
    (supabaseAdmin.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    // Mock profile lookup
    const mockProfileSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { org_id: mockOrgId },
          error: null
        })
      })
    });

    (supabaseAdmin.from as any).mockReturnValue({
      select: mockProfileSelect
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    mockReq.method = 'GET';
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.send).toHaveBeenCalledWith('Method Not Allowed');
  });

  it('should return 400 if offerText is missing', async () => {
    mockReq.body = {};
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith('Offer text is required');
  });

  it('should return 401 if user is not authenticated', async () => {
    (supabaseAdmin.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' }
    });

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.send).toHaveBeenCalledWith('Not authenticated');
  });

  it('should return 400 if user has no organization', async () => {
    const mockProfileSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })
    });

    (supabaseAdmin.from as any).mockReturnValue({
      select: mockProfileSelect
    });

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith('User has no organization');
  });

  it('should update existing offer if one exists', async () => {
    const existingDocId = 'doc-123';
    const mockExistingOffer = { id: existingDocId };

    // Mock existing offer lookup
    const mockOfferSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockExistingOffer,
            error: null
          })
        })
      })
    });

    // Mock update
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: existingDocId },
            error: null
          })
        })
      })
    });

    let fromCallCount = 0;
    (supabaseAdmin.from as any).mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) {
        // First call for profile
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { org_id: mockOrgId },
                error: null
              })
            })
          })
        };
      } else {
        // Second call for offer lookup/update
        return {
          select: mockOfferSelect,
          update: mockUpdate,
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue(null)
          })
        };
      }
    });

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(supabaseAdmin.from).toHaveBeenCalledWith('knowledge_docs');
    expect(enqueueEmbeddingJob).toHaveBeenCalledWith({
      docId: existingDocId,
      orgId: mockOrgId,
      content: 'Test offer'
    });
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should create new offer if none exists', async () => {
    const newDocId = 'new-doc-123';

    // Mock no existing offer
    const mockOfferSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })
    });

    // Mock insert
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: newDocId },
          error: null
        })
      })
    });

    let fromCallCount = 0;
    (supabaseAdmin.from as any).mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) {
        // First call for profile
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { org_id: mockOrgId },
                error: null
              })
            })
          })
        };
      } else {
        // Second call for offer lookup/insert
        return {
          select: mockOfferSelect,
          insert: mockInsert
        };
      }
    });

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(supabaseAdmin.from).toHaveBeenCalledWith('knowledge_docs');
    expect(enqueueEmbeddingJob).toHaveBeenCalledWith({
      docId: newDocId,
      orgId: mockOrgId,
      content: 'Test offer'
    });
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    const mockOfferSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        })
      })
    });

    let fromCallCount = 0;
    (supabaseAdmin.from as any).mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) {
        // First call for profile
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { org_id: mockOrgId },
                error: null
              })
            })
          })
        };
      } else {
        // Second call for offer lookup
        return {
          select: mockOfferSelect
        };
      }
    });

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
}); 