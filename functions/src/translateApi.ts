import * as functions from 'firebase-functions';
import * as corsModule from 'cors';
import fetch from 'node-fetch';

const cors = corsModule({ origin: true });

// Lingo.dev API endpoints
const LINGO_API_BASE_URL = 'https://api.lingo.dev/v1';

// Get the API key from environment variables
const getApiKey = () => {
  // In production, you would set this using Firebase environment variables:
  // firebase functions:config:set lingo.api_key="YOUR_API_KEY"
  // For development, we're using a placeholder
  return process.env.LINGO_API_KEY || 'YOUR_LINGO_API_KEY';
};

export const translateText = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Handle preflight requests for CORS
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Max-Age', '3600');
      return res.status(204).send('');
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      const { text, targetLanguage, sourceLanguage = 'auto' } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      if (!targetLanguage) {
        return res.status(400).json({ error: 'Target language is required' });
      }

      const apiKey = getApiKey();
      if (!apiKey || apiKey === 'YOUR_LINGO_API_KEY') {
        return res.status(500).json({ error: 'Translation API key not configured' });
      }

      // Call Lingo.dev API
      const response = await fetch(`${LINGO_API_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          text,
          source_language_code: sourceLanguage,
          target_language_code: targetLanguage
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Lingo API error: ${response.status} - ${errorText}`);
        return res.status(response.status).json({ 
          error: `Translation API error: ${errorText}` 
        });
      }

      const data = await response.json();
      return res.status(200).json({ 
        translatedText: data.translated_text,
        sourceLanguage: data.detected_source_language || sourceLanguage
      });
    } catch (error) {
      console.error('Error translating text:', error);
      return res.status(500).json({ error: 'Internal server error during translation' });
    }
  });
});

export const getLanguages = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Handle preflight requests for CORS
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'GET');
      res.set('Access-Control-Allow-Headers', 'Authorization');
      res.set('Access-Control-Max-Age', '3600');
      return res.status(204).send('');
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      const apiKey = getApiKey();
      if (!apiKey || apiKey === 'YOUR_LINGO_API_KEY') {
        return res.status(500).json({ error: 'Translation API key not configured' });
      }

      // Call Lingo.dev API to get supported languages
      const response = await fetch(`${LINGO_API_BASE_URL}/languages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Lingo API error: ${response.status} - ${errorText}`);
        return res.status(response.status).json({ 
          error: `Translation API error: ${errorText}` 
        });
      }

      const data = await response.json();
      return res.status(200).json({ languages: data.languages });
    } catch (error) {
      console.error('Error fetching languages:', error);
      return res.status(500).json({ error: 'Internal server error while fetching languages' });
    }
  });
});

export const detectLanguage = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Handle preflight requests for CORS
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Max-Age', '3600');
      return res.status(204).send('');
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const apiKey = getApiKey();
      if (!apiKey || apiKey === 'YOUR_LINGO_API_KEY') {
        return res.status(500).json({ error: 'Translation API key not configured' });
      }

      // Call Lingo.dev API
      const response = await fetch(`${LINGO_API_BASE_URL}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Lingo API error: ${response.status} - ${errorText}`);
        return res.status(response.status).json({ 
          error: `Language detection API error: ${errorText}` 
        });
      }

      const data = await response.json();
      return res.status(200).json({ 
        languageCode: data.language_code,
        confidence: data.confidence
      });
    } catch (error) {
      console.error('Error detecting language:', error);
      return res.status(500).json({ error: 'Internal server error during language detection' });
    }
  });
});