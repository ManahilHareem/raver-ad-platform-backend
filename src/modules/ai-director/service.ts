import { proxyPost, proxyGet } from '../../config/aiProxy';

export const chat = (body: any) => proxyPost('/api/v1/director/chat', body);
export const getSession = (sessionId: string) => proxyGet(`/api/v1/director/session/${sessionId}`);
export const getUpdate = (sessionId: string) => proxyGet(`/api/v1/director/session/${sessionId}/update`);
export const listSessions = () => proxyGet('/api/v1/director/sessions');
