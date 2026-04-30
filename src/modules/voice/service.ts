import axios from 'axios';

const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1/voices';

export const fetchElevenLabsVoices = async () => {
  try {
    const response = await axios.get(ELEVEN_LABS_API_URL, {
      headers: {
        'Accept': 'application/json',
        'xi-api-key': process.env.ELEVEN_LABS_API_KEY, // Store this in your .env
      },
    });

    return response.data.voices;
  } catch (error: any) {
    console.error('Error fetching voices from ElevenLabs:', error.message);
    throw new Error('Failed to retrieve voices from ElevenLabs.');
  }
};

export const fetchElevenLabsVoice = async (voiceId: string) => {
  try {
    const response = await axios.get(`${ELEVEN_LABS_API_URL}/${voiceId}`, {
      headers: {
        'Accept': 'application/json',
        'xi-api-key': process.env.ELEVEN_LABS_API_KEY,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error fetching voice from ElevenLabs:', error.message);
    throw new Error('Failed to retrieve voice from ElevenLabs.');
  }
};

export const generateElevenLabsTTS = async (voiceId: string, text: string) => {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.5 }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': process.env.ELEVEN_LABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer'
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error generating TTS from ElevenLabs:', error.response?.data?.toString() || error.message);
    let errorDetails = 'Failed to generate TTS from ElevenLabs.';
    if (error.response?.data) {
        try {
            const dataStr = Buffer.from(error.response.data).toString('utf8');
            errorDetails += ' ' + dataStr;
            console.error('ElevenLabs response body:', dataStr);
        } catch (e) {
            // ignore
        }
    }
    throw new Error(errorDetails);
  }
};