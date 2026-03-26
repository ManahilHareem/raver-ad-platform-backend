import { proxyPost, proxyGet } from '../../config/aiProxy';

export const renderCampaign = (body: any) => proxyPost('/api/v1/editor/render', body);
export const exportFormats = (body: any) => proxyPost('/api/v1/editor/export', body);
export const getRenders = (sessionId: string) => proxyGet(`/api/v1/editor/renders/${sessionId}`);
