import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const storedLanguage = localStorage.getItem('language');
    const lang = storedLanguage ? storedLanguage.toUpperCase() : 'EN';
    return ['EN', 'JP'].includes(lang) ? lang : 'EN';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = (lang) => {
    const normalizedLang = lang.toUpperCase();
    if (['EN', 'JP'].includes(normalizedLang)) {
      setLanguage(normalizedLang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  return useContext(LanguageContext);
};
