import { proxyPost, proxyGet, proxyDelete } from '../../config/aiProxy';

export const cloneVoice = async (body: any, files?: Express.Multer.File[]) => {
  if (!files || files.length === 0) {
    return proxyPost('/api/v1/custom-voice/clone', body);
  }

  const formData = new FormData();
  formData.append('name', body.name || '');
  
  files.forEach((file) => {
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    formData.append('files', blob, file.originalname);
  });

  return proxyPost('/api/v1/custom-voice/clone', formData);
};

export const cloneVoiceFromRecording = async (body: any, files?: Express.Multer.File[]) => {
  if (!files || files.length === 0) {
    return proxyPost('/api/v1/custom-voice/record', body);
  }

  const formData = new FormData();
  formData.append('name', body.name || '');
    
  files.forEach((file) => {
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    formData.append('files', blob, file.originalname);
  });

  return proxyPost('/api/v1/custom-voice/record', formData);
};

export const listVoices = () => proxyGet('/api/v1/custom-voice/list');
export const getVoiceDetails = (voiceId: string) => proxyGet(`/api/v1/custom-voice/${voiceId}`);
export const deleteCustomVoice = (voiceId: string) => proxyDelete(`/api/v1/custom-voice/${voiceId}`);
export const testVoice = (voiceId: string, body: any) => proxyPost(`/api/v1/custom-voice/${voiceId}/test`, body);
