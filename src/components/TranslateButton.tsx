import React, { useState } from 'react';
import { Languages, Loader } from 'lucide-react';
import { translationService } from '../lib/translationService';
import toast from 'react-hot-toast';
import { useLingo } from 'lingo.dev/react/client';
import * as Sentry from "@sentry/react";
import { captureException } from '../lib/sentryUtils';

interface TranslateButtonProps {
  text: string;
  onTranslated: (translatedText: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  targetLanguage?: string;
}

const TranslateButton: React.FC<TranslateButtonProps> = ({
  text,
  onTranslated,
  className = '',
  size = 'md',
  targetLanguage = 'en'
}) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const lingo = useLingo();
  
  const sizeClasses = {
    sm: 'p-1 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  const handleTranslate = async () => {
    if (!text || isTranslating) return;
    
    // Add a breadcrumb for debugging
    Sentry.addBreadcrumb({
      category: 'translation',
      message: `Translation requested for language: ${targetLanguage}`,
      level: 'info'
    });
    
    setIsTranslating(true);
    try {
      // First try to use Lingo.dev's built-in translation
      try {
        if (lingo.t) {
          const translated = lingo.t(text);
          if (translated !== text) {
            onTranslated(translated);
            toast.success('Translation complete');
            return;
          }
        }
      } catch (e) {
        console.warn('Lingo.dev translation failed, falling back to API:', e);
        
        // Log the error to Sentry
        captureException(e, {
          tags: {
            component: "TranslateButton",
            action: "lingo_translate",
            targetLanguage
          }
        });
      }
      
      // Fall back to API translation
      const detectedLanguage = await translationService.detectLanguage(text);
      
      // If text is already in target language, show a message
      if (detectedLanguage === targetLanguage) {
        toast.info('Text is already in the target language');
        return;
      }
      
      // Translate the text
      const translatedText = await translationService.translateText(text, {
        targetLanguage,
        sourceLanguage: detectedLanguage
      });
      
      // Call the callback with the translated text
      onTranslated(translatedText);
      
      toast.success('Translation complete');
      
      // Log successful translation to Sentry
      Sentry.addBreadcrumb({
        category: 'translation',
        message: `Translation successful: ${detectedLanguage} → ${targetLanguage}`,
        level: 'info'
      });
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed. Please try again.');
      
      // Log the error to Sentry
      captureException(error, {
        tags: {
          component: "TranslateButton",
          action: "api_translate",
          sourceLanguage: "auto",
          targetLanguage
        },
        extra: {
          textLength: text.length,
          textSample: text.substring(0, 50) // Only include first 50 chars for privacy
        }
      });
    } finally {
      setIsTranslating(false);
    }
  };
  
  return (
    <button
      onClick={handleTranslate}
      disabled={isTranslating || !text}
      className={`flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors ${sizeClasses[size]} ${className}`}
      title="Translate"
    >
      {isTranslating ? (
        <Loader className={`${iconSizes[size]} animate-spin`} />
      ) : (
        <Languages className={iconSizes[size]} />
      )}
    </button>
  );
};

export default TranslateButton;