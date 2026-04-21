import { proxyPost, proxyGet } from '../../config/aiProxy';
import prisma from '../../db/prisma';

export const chat = (body: any) => proxyPost('/api/v1/director/chat', body);
export const getSession = (sessionId: string) => proxyGet(`/api/v1/director/session/${sessionId}`);
export const getUpdate = (sessionId: string) => proxyGet(`/api/v1/director/session/${sessionId}/update`);
export const listSessions = () => proxyGet('/api/v1/director/sessions');
export const regenerateChat = (body: any) => proxyPost('/api/v1/director/regenerate-chat', body);
export const approveStep = (sessionId: string, params: { step_name?: string, action?: string, notes?: string }) => {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return proxyPost(`/api/v1/director/session/${sessionId}/approve-step?${query}`, {});
};

export const deleteSession = async (sessionId: string) => {
  try {
    // We use deleteMany to avoid throwing an error if the session was already deleted
    const result = await (prisma as any).aISession.deleteMany({
      where: {
        OR: [
          { sessionId: sessionId },
          { campaignId: sessionId },
          { sessionId: { startsWith: sessionId + '_' } } // Support versioned session IDs
        ]
      }
    });
    return { 
      success: true, 
      message: `Session ${sessionId} cleared successfully from local database`,
      count: result.count 
    };
  } catch (error) {
    console.error(`[AIDirectorService] Error deleting session ${sessionId}:`, error);
    throw error;
  }
};

