import { useState, useEffect, useCallback } from 'react';
import { Course, Deck, Word, Language, SrsData, View, Exercise, AddWordResult } from '../types';
import { SITE_LANGUAGE } from '../constants';
import { generateExercisesForWord } from '../services/geminiService';
import * as backendService from '../services/backendService';

const FSRS_INITIAL_STABILITY = 1;
const FSRS_DIFFICULTY_STEP = 0.2;
const FSRS_SUCCESS_MULTIPLIER = 2.5;
const FSRS_LAPSE_DIVISOR = 2;

const USER_SESSION_KEY = 'vocab-user-session';

export const useVocabularyStore = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // App State
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.COURSE);
  const [wordToPractice, setWordToPractice] = useState<Word | null>(null);
  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [highlightedWordId, setHighlightedWordId] = useState<string | null>(null);

  // Check for existing session on initial load
  useEffect(() => {
    try {
      const session = sessionStorage.getItem(USER_SESSION_KEY);
      if (session) {
        const { email } = JSON.parse(session);
        if (email) {
          setUserEmail(email);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error("Could not restore session", error);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Load course data when user logs in
  useEffect(() => {
    const loadData = async () => {
        if (!userEmail) return;
        setIsCourseLoading(true);
        try {
            const course = await backendService.getCourse(userEmail);
            if (course) {
                setCurrentCourse(course);
            } else {
                // If no course exists for user, clear any old state
                setCurrentCourse(null);
            }
        } catch (error) {
            console.error("Failed to load course from backend", error);
        } finally {
            setIsCourseLoading(false);
        }
    };
    loadData();
  }, [userEmail]);

  // Auth Functions
  const login = useCallback((email: string) => {
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify({ email }));
    setUserEmail(email);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(USER_SESSION_KEY);
    setUserEmail(null);
    setIsAuthenticated(false);
    setCurrentCourse(null);
    setActiveDeckId(null);
    setCurrentView(View.COURSE);
  }, []);


  const createCourse = useCallback(async (learningLanguage: Language) => {
    if (!userEmail) return;
    const newCourse: Course = {
      id: Date.now().toString(),
      learningLanguage,
      nativeLanguage: SITE_LANGUAGE,
      decks: [],
    };
    setCurrentCourse(newCourse);
    setActiveDeckId(null);
    setCurrentView(View.COURSE);
    await backendService.saveCourse(userEmail, newCourse);
  }, [userEmail]);

  const addDeck = useCallback((name: string) => {
    if (!userEmail) return;
    setCurrentCourse(prevCourse => {
      if (!prevCourse) return null;
      const newDeck: Deck = { id: Date.now().toString(), name, words: [] };
      const updatedCourse = { ...prevCourse, decks: [...prevCourse.decks, newDeck] };
      backendService.saveCourse(userEmail, updatedCourse);
      return updatedCourse;
    });
  }, [userEmail]);

  const addWord = useCallback(async (deckId: string, wordData: Omit<Word, 'id' | 'srs' | 'exercises'>): Promise<AddWordResult> => {
    const course = currentCourse;
    if (!course || !userEmail) {
        throw new Error("No course or user session.");
    }
    
    const deck = course.decks.find(d => d.id === deckId);
    if (!deck) {
        throw new Error("Deck not found.");
    }
    
    const existingWord = deck.words.find(w => w.learningWord.toLowerCase() === wordData.learningWord.toLowerCase());

    if (existingWord) {
        setHighlightedWordId(existingWord.id);
        setTimeout(() => setHighlightedWordId(null), 3000);
        return { status: 'duplicate', wordId: existingWord.id, learningWord: existingWord.learningWord };
    }

    const { learningLanguage, nativeLanguage } = course;
    const initialSrs: SrsData = { stability: FSRS_INITIAL_STABILITY, difficulty: 1, reviewDate: new Date().toISOString(), lapses: 0 };
    const newWord: Word = { ...wordData, id: Date.now().toString(), srs: initialSrs, exercises: [] };
    
    setCurrentCourse(prevCourse => {
        if (!prevCourse) return null;
        const updatedCourse = { ...prevCourse, decks: prevCourse.decks.map(d => d.id === deckId ? { ...d, words: [...d.words, newWord] } : d) };
        backendService.saveCourse(userEmail, updatedCourse);
        return updatedCourse;
    });

    (async () => {
        try {
            const exercises = await generateExercisesForWord(wordData.learningWord, wordData.nativeWord, learningLanguage, nativeLanguage);
            setCurrentCourse(prevCourse => {
                if (!prevCourse) return null;
                const courseWithExercises = { ...prevCourse, decks: prevCourse.decks.map(deck => deck.id === deckId ? { ...deck, words: deck.words.map(w => w.id === newWord.id ? { ...w, exercises } : w) } : deck) };
                backendService.saveCourse(userEmail, courseWithExercises);
                return courseWithExercises;
            });
        } catch (error) {
            console.error("Exercise generation failed, removing word from deck.", error);
            setCurrentCourse(prevCourse => {
                if (!prevCourse) return null;
                const courseAfterRollback = { ...prevCourse, decks: prevCourse.decks.map(deck => deck.id === deckId ? { ...deck, words: deck.words.filter(w => w.id !== newWord.id) } : deck) };
                backendService.saveCourse(userEmail, courseAfterRollback);
                return courseAfterRollback;
            });
        }
    })();

    return { status: 'added', wordId: newWord.id, learningWord: newWord.learningWord };
  }, [currentCourse, userEmail]);

  const removeWord = useCallback((deckId: string, wordId: string) => {
    if (!userEmail) return;
    setCurrentCourse(prevCourse => {
      if (!prevCourse) return null;
      const updatedDecks = prevCourse.decks.map(deck => deck.id === deckId ? { ...deck, words: deck.words.filter(word => word.id !== wordId) } : deck);
      const updatedCourse = { ...prevCourse, decks: updatedDecks };
      backendService.saveCourse(userEmail, updatedCourse);
      return updatedCourse;
    });
  }, [userEmail]);

  const updateWordSrs = useCallback((wordId: string, deckId: string, correct: boolean) => {
    if (!userEmail) return;
    setCurrentCourse(prevCourse => {
        if (!prevCourse) return null;
        const newDecks = prevCourse.decks.map(deck => {
            if (deck.id !== deckId) return deck;
            const newWords = deck.words.map(word => {
                if (word.id !== wordId) return word;
                const { srs } = word;
                let newSrs: SrsData;
                if (correct) {
                    const newStability = srs.stability * FSRS_SUCCESS_MULTIPLIER * srs.difficulty;
                    const reviewDate = new Date();
                    reviewDate.setDate(reviewDate.getDate() + Math.round(newStability));
                    newSrs = { ...srs, stability: newStability, difficulty: Math.max(0.1, srs.difficulty - FSRS_DIFFICULTY_STEP), reviewDate: reviewDate.toISOString() };
                } else {
                    const newStability = srs.stability / FSRS_LAPSE_DIVISOR;
                    const reviewDate = new Date();
                    reviewDate.setDate(reviewDate.getDate() + 1);
                    newSrs = { ...srs, stability: newStability, difficulty: srs.difficulty + FSRS_DIFFICULTY_STEP, reviewDate: reviewDate.toISOString(), lapses: srs.lapses + 1 };
                }
                return { ...word, srs: newSrs };
            });
            return { ...deck, words: newWords };
        });
        const updatedCourse = { ...prevCourse, decks: newDecks };
        backendService.saveCourse(userEmail, updatedCourse);
        return updatedCourse;
    });
  }, [userEmail]);

  const getWordsForPractice = useCallback(() => {
    if (!activeDeckId || !currentCourse) return [];
    const deck = currentCourse.decks.find(d => d.id === activeDeckId);
    if (!deck) return [];
    const now = new Date();
    return deck.words.filter(word => new Date(word.srs.reviewDate) <= now && word.exercises.length > 0).sort((a, b) => new Date(a.srs.reviewDate).getTime() - new Date(b.srs.reviewDate).getTime());
  }, [currentCourse, activeDeckId]);

  const resetData = useCallback(async () => {
    if (!userEmail) return;
    await backendService.deleteCourse(userEmail);
    setCurrentCourse(null);
    setActiveDeckId(null);
    setCurrentView(View.COURSE);
  }, [userEmail]);

  const startPracticeForWord = useCallback((word: Word) => {
    setWordToPractice(word);
    setCurrentView(View.PRACTICE);
  }, []);

  const endPractice = useCallback(() => {
    setWordToPractice(null);
  }, []);

  const activeDeck = currentCourse?.decks.find(d => d.id === activeDeckId) || null;
  
  const customSetActiveDeckId = useCallback((deckId: string | null) => {
    setHighlightedWordId(null);
    setActiveDeckId(deckId);
  }, []);

  return { 
    // Auth
    isAuthenticated,
    userEmail,
    login,
    logout,
    // App
    currentCourse, 
    isLoading: isAuthLoading || isCourseLoading,
    createCourse, 
    addDeck, 
    addWord, 
    removeWord,
    updateWordSrs, 
    activeDeck,
    setActiveDeckId: customSetActiveDeckId,
    getWordsForPractice,
    currentView,
    setCurrentView,
    resetData,
    wordToPractice,
    startPracticeForWord,
    endPractice,
    highlightedWordId,
  };
};
