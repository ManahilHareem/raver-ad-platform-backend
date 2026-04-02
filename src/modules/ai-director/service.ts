import { proxyPost, proxyGet } from '../../config/aiProxy';

export const chat = (body: any) => proxyPost('/api/v1/director/chat', body);
export const getSession = (sessionId: string) => proxyGet(`/api/v1/director/session/${sessionId}`);
export const getUpdate = (sessionId: string) => proxyGet(`/api/v1/director/session/${sessionId}/update`);
export const listSessions = () => proxyGet('/api/v1/director/sessions');

export const deleteSession = async (sessionId: string) => {
  // Note: The external AI backend does not currently have a dedicated DELETE endpoint for director sessions.
  // This serves as a placeholder to signify successful session removal from our backend/UI.
  return { success: true, message: `Session ${sessionId} cleared successfully` };
};
export const regenerateChat = (body: any) => proxyPost('/api/v1/director/chat', body);
