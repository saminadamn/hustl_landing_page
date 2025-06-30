import React, { createContext, useContext, useState, useEffect } from 'react';
import { translationService } from '../lib/translationService';
import { useLingo } from 'lingo.dev/react/client';
import * as Sentry from "@sentry/react";
import { captureException } from '../lib/sentryUtils';

interface TranslationContextType {
  currentLanguage: string;
  setLanguage: (languageCode: string) => void;
  translateText: (text: string) => Promise<string>;
  isTranslating: boolean;
  t: (text: string) => string;
}

const TranslationContext = createContext<TranslationContextType>({
  currentLanguage: 'en',
  setLanguage: () => {},
  translateText: async (text) => text,
  isTranslating: false,
  t: (text) => text
});

export const useTranslation = () => useContext(TranslationContext);

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const lingo = useLingo();
  
  useEffect(() => {
    // Load saved language preference from localStorage
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
      if (lingo.setLocale) {
        lingo.setLocale(savedLanguage);
      }
      
      // Set language in Sentry for better error context
      Sentry.setTag("language", savedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0];
      setCurrentLanguage(browserLang || 'en');
      if (lingo.setLocale) {
        lingo.setLocale(browserLang || 'en');
      }
      
      // Set detected language in Sentry
      Sentry.setTag("language", browserLang || 'en');
    }
  }, []);
  
  // When locale changes from Lingo, update our state
  useEffect(() => {
    if (lingo.locale && lingo.locale !== currentLanguage) {
      setCurrentLanguage(lingo.locale);
      localStorage.setItem('preferredLanguage', lingo.locale);
      
      // Update language in Sentry
      Sentry.setTag("language", lingo.locale);
    }
  }, [lingo.locale, currentLanguage]);
  
  const setLanguage = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    if (lingo.setLocale) {
      lingo.setLocale(languageCode);
    }
    localStorage.setItem('preferredLanguage', languageCode);
    
    // Update language in Sentry
    Sentry.setTag("language", languageCode);
  };
  
  const translateText = async (text: string): Promise<string> => {
    if (!text || currentLanguage === 'en') return text;
    
    setIsTranslating(true);
    try {
      const translatedText = await translationService.translateText(text, {
        targetLanguage: currentLanguage
      });
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      
      // Capture the translation error in Sentry
      captureException(error, {
        tags: {
          component: "TranslationProvider",
          action: "translateText",
          sourceLanguage: "auto",
          targetLanguage: currentLanguage
        },
        extra: {
          text: text.substring(0, 100) // Only include first 100 chars for privacy
        }
      });
      
      return text; // Return original text on error
    } finally {
      setIsTranslating(false);
    }
  };
  
  return (
    <TranslationContext.Provider value={{
      currentLanguage,
      setLanguage,
      translateText,
      isTranslating,
      t: (text: string) => {
        try {
          return lingo.t ? lingo.t(text) : text;
        } catch (e) {
          // Capture translation errors in Sentry
          captureException(e, {
            tags: {
              component: "TranslationProvider",
              action: "t",
              language: currentLanguage
            },
            extra: {
              text: text.substring(0, 100) // Only include first 100 chars for privacy
            }
          });
          return text;
        }
      }
    }}>
      {children}
    </TranslationContext.Provider>
  );
};