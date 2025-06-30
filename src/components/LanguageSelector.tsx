import React, { useState, useEffect } from 'react';
import { Languages, ChevronDown, Check, X, Search } from 'lucide-react';
import { translationService } from '../lib/translationService';
import toast from 'react-hot-toast';
import { useLingo } from 'lingo.dev/react/client';

interface LanguageSelectorProps {
  value: string;
  onChange: (languageCode: string) => void;
  className?: string;
}

interface Language {
  code: string;
  name: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const lingo = useLingo();
  
  // Common languages to show by default while loading
  const commonLanguages: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'it', name: 'Italian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'hi', name: 'Hindi' },
    { code: 'tr', name: 'Turkish' },
    { code: 'vi', name: 'Vietnamese' }
  ];
  
  useEffect(() => {
    // Load languages when component mounts
    loadLanguages();
  }, []);
  
  useEffect(() => {
    // Sync with Lingo locale
    if (lingo.locale && lingo.locale !== value) {
      onChange(lingo.locale);
    }
  }, [lingo.locale, value, onChange]);
  
  const loadLanguages = async () => {
    setLoading(true);
    try {
      // First set common languages for immediate display
      setLanguages(commonLanguages);
      
      // Then try to load from API
      if (translationService.isAvailable()) {
        const apiLanguages = await translationService.getAvailableLanguages();
        if (apiLanguages && apiLanguages.length > 0) {
          setLanguages(apiLanguages);
        }
      }
    } catch (error) {
      console.error('Error loading languages:', error);
      // Keep using common languages if API fails
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectLanguage = (code: string) => {
    onChange(code);
    if (lingo.setLocale) {
      lingo.setLocale(code);
    }
    setIsOpen(false);
  };
  
  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const selectedLanguage = languages.find(lang => lang.code === value);
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
      >
        <Languages className="w-4 h-4 text-gray-500" />
        <span>{selectedLanguage?.name || 'Select language'}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-2 border-b">
            <div className="flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-8 pr-8 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {loading && filteredLanguages.length === 0 ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No languages found
              </div>
            ) : (
              filteredLanguages.map(language => (
                <button
                  key={language.code}
                  onClick={() => handleSelectLanguage(language.code)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between ${
                    language.code === value ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  <span>{language.name}</span>
                  {language.code === value && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;