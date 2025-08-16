import React, { createContext, useContext, ReactNode } from 'react';
import { useVocabularyStore } from '../hooks/useVocabularyStore';
import { Course, StudySet, Word, View, Exercise, AddWordResult } from '../types';

interface AppContextType {
  // Auth state
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string) => void;
  logout: () => void;
  
  // App state
  currentCourse: Course | null;
  isLoading: boolean;
  currentView: View;
  setCurrentView: (view: View) => void;
  createCourse: (learningLanguage: { code: string; name:string }) => void;
  addStudySet: (name: string) => void;
  addWord: (studySetId: string, word: Omit<Word, 'id' | 'srs' | 'exercises'>) => Promise<AddWordResult>;
  removeWord: (studySetId: string, wordId: string) => void;
  updateWordSrs: (wordId: string, studySetId: string, correct: boolean) => void;
  activeStudySet: StudySet | null;
  setActiveStudySetId: (studySetId: string | null) => void;
  getWordsForPractice: () => Word[];
  wordToPractice: Word | null;
  startPracticeForWord: (word: Word) => void;
  endPractice: () => void;
  highlightedWordId: string | null;
  expandedWordId: string | null;
  setExpandedWordId: (wordId: string | null) => void;
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