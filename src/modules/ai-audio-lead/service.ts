import { proxyPost, proxyGet } from '../../config/aiProxy';

export const generateMusic = (body: any) => proxyPost('/api/v1/audio-lead/music', body);
export const generateVoiceover = (body: any) => proxyPost('/api/v1/audio-lead/voiceover', body);
export const produceAudio = (body: any) => proxyPost('/api/v1/audio-lead/produce', body);
export const mixAudio = (body: any) => proxyPost('/api/v1/audio-lead/mix', body);
export const getVault = (sessionId: string) => proxyGet(`/api/v1/audio-lead/vault/${sessionId}`);
