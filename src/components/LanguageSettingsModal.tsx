import React, { useState, useEffect } from 'react';
import { X, Languages, Check, Globe, Info } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from './TranslationProvider';

interface LanguageSettingsModalProps {
  onClose: () => void;
}

const LanguageSettingsModal: React.FC<LanguageSettingsModalProps> = ({ onClose }) => {
  const { currentLanguage, setLanguage, t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [autoTranslate, setAutoTranslate] = useState(false);
  
  useEffect(() => {
    // Load auto-translate setting from localStorage
    const savedAutoTranslate = localStorage.getItem('autoTranslate');
    if (savedAutoTranslate) {
      setAutoTranslate(savedAutoTranslate === 'true');
    }
  }, []);
  
  const handleSaveSettings = () => {
    // Save language preference
    setLanguage(selectedLanguage);
    
    // Save auto-translate setting
    localStorage.setItem('autoTranslate', autoTranslate.toString());
    
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <Languages className="w-6 h-6 text-[#0021A5] mr-2" />
            {t("Language Settings")}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("Select Your Preferred Language")}
            </label>
            <LanguageSelector
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoTranslate"
              checked={autoTranslate}
              onChange={(e) => setAutoTranslate(e.target.checked)}
              className="h-4 w-4 text-[#0021A5] focus:ring-[#0021A5] border-gray-300 rounded"
            />
            <label htmlFor="autoTranslate" className="ml-2 block text-sm text-gray-700">
              {t("Automatically translate content to my language")}
            </label>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">{t("About Translation")}</h4>
                <p className="mt-1 text-sm text-blue-700">
                  {t("Translation is powered by Lingo.dev. While we strive for accuracy, automatic translations may not be perfect. You can always view the original text.")}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleSaveSettings}
              className="flex-1 bg-[#0021A5] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#001B8C] transition-colors flex items-center justify-center"
            >
              <Check className="w-5 h-5 mr-2" />
              {t("Save Settings")}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t("Cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSettingsModal;