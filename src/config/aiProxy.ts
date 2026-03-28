import axios, { AxiosError } from 'axios';

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'https://apiplatform.raver.ai';

/**
 * Generic proxy helper for forwarding requests to the external AI backend.
 * Used by all AI proxy modules (ads, chat, image-lead, audio-lead, etc.)
 */
export const proxyPost = async (path: string, body: any) => {
  try {
    const payload = body || {}; // Ensure we always send at least an empty object if undefined
    console.log(`[AIProxy] Forwarding POST request to ${path} with body:`, JSON.stringify(payload).substring(0, 100) + '...');
    const response = await axios.post(`${AI_BACKEND_URL}${path}`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: Number(process.env.API_TIMEOUT) || 600000, // 10 min timeout for long AI generation tasks
    });
    return response.data;
  } catch (error) {
    const axiosErr = error as AxiosError;
    if (axiosErr.response) {
      const data = axiosErr.response.data as any;
      console.error(`[AIProxy] Error from AI backend ${path}:`, JSON.stringify(data, null, 2));
      if (Array.isArray(data?.detail)) {
        throw { status: axiosErr.response.status, message: data.detail.map((e: any) => `${e.loc?.join('.') || ''} - ${e.msg}`).join(', '), data };
      }
      throw { status: axiosErr.response.status, message: JSON.stringify(data), data };
    }
    console.error(`[AIProxy] Failed to reach AI backend ${path}:`, axiosErr.message);
    throw { status: 503, message: 'Failed to communicate with AI service' };
  }
};

export const proxyGet = async (path: string) => {
  try {
    const response = await axios.get(`${AI_BACKEND_URL}${path}`, {
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    const axiosErr = error as AxiosError;
    if (axiosErr.response) {
      const data = axiosErr.response.data as any;
      console.error(`[AIProxy] Error from AI backend ${path}:`, JSON.stringify(data, null, 2));
      throw { status: axiosErr.response.status, message: JSON.stringify(data), data };
    }
    console.error(`[AIProxy] Failed to reach AI backend ${path}:`, axiosErr.message);
    throw { status: 503, message: 'Failed to communicate with AI service' };
  }
};
