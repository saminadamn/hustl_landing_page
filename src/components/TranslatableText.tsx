import React, { useState, useEffect } from 'react';
import { Languages, Loader } from 'lucide-react';
import { translationService } from '../lib/translationService';
import { useTranslation } from './TranslationProvider';

interface TranslatableTextProps {
  text: string;
  className?: string;
  showTranslateButton?: boolean;
}

const TranslatableText: React.FC<TranslatableTextProps> = ({
  text,
  className = '',
  showTranslateButton = true
}) => {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const { currentLanguage, t } = useTranslation();
  
  useEffect(() => {
    // Reset translation when language changes
    setTranslatedText(null);
    setIsTranslated(false);
  }, [currentLanguage, text]);
  
  const handleTranslate = async () => {
    if (isTranslating || !text) return;
    
    setIsTranslating(true);
    try {
      // First try to use Lingo.dev's built-in translation
      try {
        const translated = t(text);
        if (translated !== text) {
          setTranslatedText(translated);
          setIsTranslated(true);
          return;
        }
      } catch (e) {
        console.warn('Lingo.dev translation failed, falling back to API:', e);
      }
      
      // Fall back to API translation
      const detectedLanguage = await translationService.detectLanguage(text);
      
      // If text is already in target language, don't translate
      if (detectedLanguage === currentLanguage) {
        setIsTranslated(true);
        return;
      }
      
      // Translate the text
      const result = await translationService.translateText(text, {
        targetLanguage: currentLanguage,
        sourceLanguage: detectedLanguage
      });
      
      setTranslatedText(result);
      setIsTranslated(true);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };
  
  const toggleTranslation = () => {
    if (isTranslated && !isTranslating) {
      setIsTranslated(false);
    } else {
      handleTranslate();
    }
  };
  
  // If auto-translate is enabled, translate on mount
  useEffect(() => {
    if (currentLanguage !== 'en' && text) {
      handleTranslate();
    }
  }, []);
  
  return (
    <div className={className}>
      <div className="relative">
        {/* Display either original or translated text */}
        <div>
          {isTranslated && translatedText ? translatedText : text}
        </div>
        
        {/* Translation button */}
        {showTranslateButton && text && (
          <button
            onClick={toggleTranslation}
            disabled={isTranslating}
            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-1"
          >
            {isTranslating ? (
              <>
                <Loader className="w-3 h-3 mr-1 animate-spin" />
                Translating...
              </>
            ) : isTranslated ? (
              <>
                <Languages className="w-3 h-3 mr-1" />
                Show original
              </>
            ) : (
              <>
                <Languages className="w-3 h-3 mr-1" />
                Translate
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default TranslatableText;