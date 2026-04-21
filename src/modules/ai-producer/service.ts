import { proxyPost, proxyGet } from '../../config/aiProxy';

export const launchCampaign = (body: any) => proxyPost('/api/v1/producer/campaign', body);
export const getCampaign = (campaignId: string) => proxyGet(`/api/v1/producer/campaign/${campaignId}`);
export const listCampaigns = () => proxyGet('/api/v1/producer/campaigns');
// export const approveCampaign = (campaignId: string, body: any) => proxyPost(`/api/v1/producer/campaign/${campaignId}/approve`, body);
export const approveStep = (campaignId: string, params: { step_name?: string, action?: string, notes?: string }) => {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return proxyPost(`/api/v1/director/session/${campaignId}/approve-step?${query}`, {});
};