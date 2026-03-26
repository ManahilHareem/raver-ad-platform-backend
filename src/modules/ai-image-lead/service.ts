import { proxyPost, proxyGet } from '../../config/aiProxy';

export const generateImages = async (body: any) => proxyPost('/api/v1/image-lead/generate', body);
export const enhanceImage = async (body: any) => proxyPost('/api/v1/image-lead/enhance', body);
export const getVault = async (sessionId: string) => proxyGet(`/api/v1/image-lead/vault/${sessionId}`);
