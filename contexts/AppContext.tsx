import React, { createContext, useContext, ReactNode } from 'react';
import { useVocabularyStore } from '../hooks/useVocabularyStore';
import { Course, Deck, Word, View, Exercise, AddWordResult } from '../types';

interface AppContextType {
  currentCourse: Course | null;
  isLoading: boolean;
  currentView: View;
  setCurrentView: (view: View) => void;
  createCourse: (learningLanguage: { code: string; name:string }) => void;
  addDeck: (name: string) => void;
  addWord: (deckId: string, word: Omit<Word, 'id' | 'srs' | 'exercises'>) => Promise<AddWordResult>;
  removeWord: (deckId: string, wordId: string) => void;
  updateWordSrs: (wordId: string, deckId: string, correct: boolean) => void;
  activeDeck: Deck | null;
  setActiveDeckId: (deckId: string | null) => void;
  getWordsForPractice: () => Word[];
  resetData: () => void;
  wordToPractice: Word | null;
  startPracticeForWord: (word: Word) => void;
  endPractice: () => void;
  highlightedWordId: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useVocabularyStore();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
