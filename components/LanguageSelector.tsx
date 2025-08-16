
import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { LANGUAGES } from '../constants';
import { Language } from '../types';

const LanguageSelector: React.FC = () => {
  const { createCourse } = useAppContext();

  const handleSelectLanguage = (language: Language) => {
    createCourse(language);
  };

  return (
    <div className="text-center max-w-2xl mx-auto mt-10">
      <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Welcome to VocabBoost AI</h2>
      <p className="mt-4 text-lg text-muted-foreground">
        To get started, please select the language you want to learn.
      </p>
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelectLanguage(lang)}
            className="flex items-center justify-center p-4 bg-card rounded-lg shadow-md hover:shadow-lg hover:bg-secondary transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            <span className="text-lg font-semibold text-card-foreground">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;