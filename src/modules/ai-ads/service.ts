import { proxyPost } from '../../config/aiProxy';

export const generateCampaign = async (body: any) => proxyPost('/api/v1/ads/generate-campaign', body);
export const generateVariations = async (body: any) => proxyPost('/api/v1/ads/generate-variations', body);
export const generateMultipleFal = async (body: any) => proxyPost('/api/v1/ads/generate-multiple-fal', body);
export const generateAudio = async (body: any) => proxyPost('/api/v1/ads/generate-audio', body);
export const generatePreviews = async (body: any) => proxyPost('/api/v1/ads/generate-previews', body);
