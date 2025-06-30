import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import * as corsModule from 'cors';

const cors = corsModule({ origin: true });

export const generateSpeech = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
      }
      return res.status(405).send('Method Not Allowed');
    }

    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = req.body;

    if (!text) {
      return res.status(400).send('Text is required.');
    }

    // Get API key from Firebase Functions configuration
    const elevenLabsApiKey = functions.config().elevenlabs?.api_key;
    
    if (!elevenLabsApiKey) {
      console.error('ElevenLabs API key not configured. Please set it using: firebase functions:config:set elevenlabs.api_key="YOUR_API_KEY"');
      return res.status(500).send('ElevenLabs API key not configured');
    }

    try {
      const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey,
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!elevenLabsResponse.ok) {
        const errorText = await elevenLabsResponse.text();
        console.error(`ElevenLabs API error: ${elevenLabsResponse.status} - ${errorText}`);
        return res.status(elevenLabsResponse.status).send(`ElevenLabs API error: ${errorText}`);
      }

      // Set response headers for audio streaming
      res.set('Content-Type', 'audio/mpeg');
      res.set('Cache-Control', 'public, max-age=3600');

      // Pipe the audio stream directly to the response
      elevenLabsResponse.body.pipe(res);

    } catch (error) {
      console.error('Error generating speech:', error);
      return res.status(500).send('Internal server error during speech generation.');
    }
  });
});