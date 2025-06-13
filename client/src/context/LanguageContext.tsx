import React, { createContext, useContext, useState, useEffect } from "react";
import { languages, getTranslation, getLanguageName } from "@/lib/i18n";

interface LanguageContextType {
  currentLanguage: string;
  availableLanguages: { code: string; name: string }[];
  changeLanguage: (langCode: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Get user's browser language or default to English
const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.split('-')[0];
  const isSupported = languages.some(lang => lang.code === browserLang);
  return isSupported ? browserLang : 'en';
};

// Get language from localStorage or use browser language
const getInitialLanguage = (): string => {
  const savedLang = localStorage.getItem('flowcreate-language');
  return savedLang || getBrowserLanguage();
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(getInitialLanguage());

  // Language list for UI
  const availableLanguages = languages.map(lang => ({
    code: lang.code,
    name: lang.name
  }));

  // Change language function
  const changeLanguage = (langCode: string) => {
    if (languages.some(lang => lang.code === langCode)) {
      setCurrentLanguage(langCode);
      localStorage.setItem('flowcreate-language', langCode);
    }
  };

  // Translation function
  const t = (key: string): string => {
    return getTranslation(currentLanguage, key);
  };

  // Update HTML lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const value = {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    t
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
