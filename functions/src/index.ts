import * as admin from 'firebase-admin';
admin.initializeApp();

// Import and export your new ElevenLabs function
export { generateSpeech } from './elevenlabsApi';

// Import and export translation functions
export { translateText, getLanguages, detectLanguage } from './translateApi';

// You might have other functions here as well
// export { myOtherFunction } from './myOtherFunctionFile';