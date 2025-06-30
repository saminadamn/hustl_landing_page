import { auth } from './firebase';

interface TranslationOptions {
  targetLanguage: string;
  sourceLanguage?: string;
}

class TranslationService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.lingo.dev/v1';
  
  constructor() {
    // Initialize with environment variable if available
    this.apiKey = import.meta.env.VITE_LINGO_API_KEY || null;
  }
  
  /**
   * Set the API key for Lingo.dev
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Check if the translation service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
  
  /**
   * Translate text using Lingo.dev API
   */
  async translateText(text: string, options: TranslationOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Translation API key not configured');
    }
    
    if (!text || text.trim() === '') {
      return text;
    }
    
    try {
      // Call the Lingo.dev API through our Firebase function
      const functionUrl = `${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/translateText`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.currentUser?.uid || 'anonymous'}`
        },
        body: JSON.stringify({
          text,
          targetLanguage: options.targetLanguage,
          sourceLanguage: options.sourceLanguage || 'auto'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation failed');
      }
      
      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }
  
  /**
   * Get available languages for translation
   */
  async getAvailableLanguages(): Promise<{ code: string, name: string }[]> {
    if (!this.apiKey) {
      throw new Error('Translation API key not configured');
    }
    
    try {
      // Call the Lingo.dev API through our Firebase function
      const functionUrl = `${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/getLanguages`;
      
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.currentUser?.uid || 'anonymous'}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch languages');
      }
      
      const data = await response.json();
      return data.languages;
    } catch (error) {
      console.error('Error fetching languages:', error);
      throw error;
    }
  }
  
  /**
   * Detect language of text
   */
  async detectLanguage(text: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Translation API key not configured');
    }
    
    if (!text || text.trim() === '') {
      return 'en'; // Default to English for empty text
    }
    
    try {
      // Call the Lingo.dev API through our Firebase function
      const functionUrl = `${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/detectLanguage`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.currentUser?.uid || 'anonymous'}`
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Language detection failed');
      }
      
      const data = await response.json();
      return data.languageCode;
    } catch (error) {
      console.error('Language detection error:', error);
      throw error;
    }
  }
}

export const translationService = new TranslationService();