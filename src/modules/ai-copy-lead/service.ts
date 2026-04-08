import { proxyPost, proxyGet } from '../../config/aiProxy';

export const generateScript = (body: any) => proxyPost('/api/v1/copy-lead/script', body);
export const generateCaptions = (body: any) => proxyPost('/api/v1/copy-lead/captions', body);
export const generateOverlays = (body: any) => proxyPost('/api/v1/copy-lead/overlays', body);
export const generateCta = (body: any) => proxyPost('/api/v1/copy-lead/cta', body);
export const generateHashtags = (body: any) => proxyPost('/api/v1/copy-lead/hashtags', body);
export const produceCopy = (body: any) => proxyPost('/api/v1/copy-lead/produce', body);
export const getVault = (sessionId: string) => proxyGet(`/api/v1/copy-lead/vault/${sessionId}`);
