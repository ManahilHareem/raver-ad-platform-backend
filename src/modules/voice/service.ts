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