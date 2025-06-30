import { captureException } from './sentryUtils';

interface ElevenLabsError {
  detail?: {
    status?: string;
    message?: string;
  };
}

// Audio manager interface for the singleton pattern
interface AudioManager {
  isPlaying: boolean;
  currentAudio: HTMLAudioElement | null;
  playAudio(audioUrl: string): Promise<void>;
  stopAudio(): void;
}

class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    // Use the provided API key directly
    this.apiKey = 'sk_62130d93d13c24299e9b4c09d7328be83bf15748f93be331';
  }

  private isServiceAvailable(): boolean {
    return true; // Always available with hardcoded key
  }

  private handleApiError(error: any): never {
    console.error('ElevenLabs API Error:', error);
    
    // Check if it's the specific "unusual activity" error
    if (error.detail?.status === 'detected_unusual_activity') {
      throw new Error('Voice features are temporarily unavailable. This may be due to ElevenLabs Free Tier restrictions. Please try again later or consider upgrading your ElevenLabs plan.');
    }
    
    // Handle other common errors
    if (error.status === 401) {
      throw new Error('Voice features are unavailable due to authentication issues.');
    }
    
    if (error.status === 429) {
      throw new Error('Voice features are temporarily unavailable due to rate limiting. Please try again later.');
    }
    
    // Generic error
    throw new Error('Voice features are currently unavailable. Please try again later.');
  }

  async speakText(
    text: string, 
    voiceId: string = 'EXAVITQu4vr4xnSDxMaL', 
    audioManager?: AudioManager
  ): Promise<void> {
    if (!this.isServiceAvailable()) {
      console.warn('ElevenLabs API key not configured. Voice features disabled.');
      return; // Silently fail if no API key
    }

    try {
      // If an audio manager is provided and it's currently playing, stop it first
      if (audioManager && audioManager.isPlaying) {
        audioManager.stopAudio();
      }
      
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.handleApiError(errorData);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // If an audio manager is provided, use it to play the audio
      if (audioManager) {
        return audioManager.playAudio(audioUrl);
      }
      
      // Otherwise, use the default audio playback
      const audio = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = (e) => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Failed to play audio'));
          captureException(e, {
            tags: { component: "ElevenLabsService", action: "playAudio" }
          });
        };
        
        // Use a try-catch block for the play() call
        try {
          const playPromise = audio.play();
          
          // Modern browsers return a promise from play()
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.warn('Audio playback error:', err.message);
              URL.revokeObjectURL(audioUrl);
              // Don't reject here, just log the error
              captureException(err, {
                tags: { component: "ElevenLabsService", action: "playAudio" }
              });
              resolve(); // Resolve anyway to prevent blocking
            });
          }
        } catch (err) {
          console.warn('Audio playback error:', err);
          URL.revokeObjectURL(audioUrl);
          // Don't reject here, just log the error
          captureException(err, {
            tags: { component: "ElevenLabsService", action: "playAudio" }
          });
          resolve(); // Resolve anyway to prevent blocking
        }
      });
    } catch (error: any) {
      // If it's already our custom error, re-throw it
      if (error.message.includes('Voice features are')) {
        throw error;
      }
      
      // Handle network errors and other issues
      console.error('Error in speakText:', error);
      captureException(error, {
        tags: { component: "ElevenLabsService", action: "speakText" }
      });
      throw new Error('Voice features are currently unavailable due to a network error.');
    }
  }

  async getVoices(): Promise<any[]> {
    if (!this.isServiceAvailable()) {
      console.warn('ElevenLabs API key not configured. Returning empty voices list.');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.handleApiError(errorData);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error: any) {
      console.error('Error fetching voices:', error);
      captureException(error, {
        tags: { component: "ElevenLabsService", action: "getVoices" }
      });
      return []; // Return empty array on error
    }
  }
}

export const elevenLabsService = new ElevenLabsService();