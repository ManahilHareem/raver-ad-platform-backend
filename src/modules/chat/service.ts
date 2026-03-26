import { proxyPost, proxyGet } from '../../config/aiProxy';

export const sendMessage = async (sessionId: string, message: string, websiteUrl?: string) => {
  return proxyPost('/api/v1/chat/', { session_id: sessionId, message, website_url: websiteUrl || null });
};

export const getChatHistory = async (sessionId: string) => {
  return proxyGet(`/api/v1/chat/history/${sessionId}`);
};

export const deleteSession = async (sessionId: string) => {
  // Note: The external AI backend does not currently have a DELETE endpoint for sessions.
  // This is a placeholder for the frontend to signify successful session removal from UI.
  return { message: `Session ${sessionId} cleared successfully` };
};
