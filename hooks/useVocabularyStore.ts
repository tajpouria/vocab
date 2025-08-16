import { useState, useEffect, useCallback } from 'react';
import { Course, Deck, Word, Language, SrsData, View, Exercise, AddWordResult } from '../types';
import { SITE_LANGUAGE } from '../constants';
import { generateExercisesForWord } from '../services/geminiService';
import * as backendService from '../services/backendService';

const FSRS_INITIAL_STABILITY = 1;
const FSRS_DIFFICULTY_STEP = 0.2;
const FSRS_SUCCESS_MULTIPLIER = 2.5;
const FSRS_LAPSE_DIVISOR = 2;

export const useVocabularyStore = () => {
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.COURSE);
  const [wordToPractice, setWordToPractice] = useState<Word | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedWordId, setHighlightedWordId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            const course = await backendService.getCourse();
            if (course) {
                setCurrentCourse(course);
            }
        } catch (error) {
            console.error("Failed to load course from backend", error);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, []);

  const createCourse = useCallback(async (learningLanguage: Language) => {
    const newCourse: Course = {
      id: Date.now().toString(),
      learningLanguage,
      nativeLanguage: SITE_LANGUAGE,
      decks: [],
    };
    setCurrentCourse(newCourse);
    setActiveDeckId(null);
    setCurrentView(View.COURSE);
    await backendService.saveCourse(newCourse);
  }, []);

  const addDeck = useCallback((name: string) => {
    setCurrentCourse(prevCourse => {
      if (!prevCourse) return null;
      const newDeck: Deck = { id: Date.now().toString(), name, words: [] };
      const updatedCourse = { ...prevCourse, decks: [...prevCourse.decks, newDeck] };
      backendService.saveCourse(updatedCourse);
      return updatedCourse;
    });
  }, []);

  const addWord = useCallback(async (deckId: string, wordData: Omit<Word, 'id' | 'srs' | 'exercises'>): Promise<AddWordResult> => {
    const course = currentCourse;
    if (!course) {
        throw new Error("No course selected.");
    }
    
    const deck = course.decks.find(d => d.id === deckId);
    if (!deck) {
        throw new Error("Deck not found.");
    }
    
    const existingWord = deck.words.find(w => w.learningWord.toLowerCase() === wordData.learningWord.toLowerCase());

    if (existingWord) {
        setHighlightedWordId(existingWord.id);
        setTimeout(() => setHighlightedWordId(null), 3000);
        return {
            status: 'duplicate',
            wordId: existingWord.id,
            learningWord: existingWord.learningWord,
        };
    }

    const { learningLanguage, nativeLanguage } = course;

    const initialSrs: SrsData = {
      stability: FSRS_INITIAL_STABILITY,
      difficulty: 1,
      reviewDate: new Date().toISOString(),
      lapses: 0,
    };

    const newWord: Word = {
      ...wordData,
      id: Date.now().toString(),
      srs: initialSrs,
      exercises: []
    };
    
    // Add word to state immediately, so UI updates and shows the spinner.
    setCurrentCourse(prevCourse => {
        if (!prevCourse) return null;
        const updatedCourse = {
            ...prevCourse,
            decks: prevCourse.decks.map(d =>
                d.id === deckId ? { ...d, words: [...d.words, newWord] } : d
            )
        };
        backendService.saveCourse(updatedCourse);
        return updatedCourse;
    });

    // Fire-and-forget async function to generate exercises without blocking UI.
    (async () => {
        try {
            const exercises = await generateExercisesForWord(wordData.learningWord, wordData.nativeWord, learningLanguage, nativeLanguage);
            
            // On success, update the word with its new exercises.
            setCurrentCourse(prevCourse => {
                if (!prevCourse) return null;
                const courseWithExercises = {
                    ...prevCourse,
                    decks: prevCourse.decks.map(deck => {
                        if (deck.id === deckId) {
                            return { ...deck, words: deck.words.map(w => w.id === newWord.id ? { ...w, exercises } : w) };
                        }
                        return deck;
                    })
                };
                backendService.saveCourse(courseWithExercises);
                return courseWithExercises;
            });

        } catch (error) {
            console.error("Exercise generation failed, removing word from deck.", error);
            // On failure, roll back by removing the word.
            setCurrentCourse(prevCourse => {
                if (!prevCourse) return null;
                const courseAfterRollback = {
                    ...prevCourse,
                    decks: prevCourse.decks.map(deck => {
                        if (deck.id === deckId) {
                            return { ...deck, words: deck.words.filter(w => w.id !== newWord.id) };
                        }
                        return deck;
                    })
                };
                backendService.saveCourse(courseAfterRollback);
                return courseAfterRollback;
            });
        }
    })();

    // Return immediately, allowing the form to become active again.
    return { status: 'added', wordId: newWord.id, learningWord: newWord.learningWord };
  }, [currentCourse]);

  const removeWord = useCallback((deckId: string, wordId: string) => {
    setCurrentCourse(prevCourse => {
      if (!prevCourse) return null;

      const updatedDecks = prevCourse.decks.map(deck => {
        if (deck.id === deckId) {
          const updatedWords = deck.words.filter(word => word.id !== wordId);
          return { ...deck, words: updatedWords };
        }
        return deck;
      });

      const updatedCourse = { ...prevCourse, decks: updatedDecks };
      backendService.saveCourse(updatedCourse);
      return updatedCourse;
    });
  }, []);


  const updateWordSrs = useCallback((wordId: string, deckId: string, correct: boolean) => {
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
                    newSrs = {
                        ...srs,
                        stability: newStability,
                        difficulty: Math.max(0.1, srs.difficulty - FSRS_DIFFICULTY_STEP),
                        reviewDate: reviewDate.toISOString(),
                    };
                } else {
                    const newStability = srs.stability / FSRS_LAPSE_DIVISOR;
                    const reviewDate = new Date();
                    reviewDate.setDate(reviewDate.getDate() + 1);
                    newSrs = {
                        ...srs,
                        stability: newStability,
                        difficulty: srs.difficulty + FSRS_DIFFICULTY_STEP,
                        reviewDate: reviewDate.toISOString(),
                        lapses: srs.lapses + 1,
                    };
                }
                return { ...word, srs: newSrs };
            });
            return { ...deck, words: newWords };
        });

        const updatedCourse = { ...prevCourse, decks: newDecks };
        backendService.saveCourse(updatedCourse);
        return updatedCourse;
    });
}, []);

  const getWordsForPractice = useCallback(() => {
    if (!activeDeckId || !currentCourse) return [];
    const deck = currentCourse.decks.find(d => d.id === activeDeckId);
    if (!deck) return [];

    const now = new Date();
    return deck.words
      .filter(word => new Date(word.srs.reviewDate) <= now && word.exercises.length > 0)
      .sort((a, b) => new Date(a.srs.reviewDate).getTime() - new Date(b.srs.reviewDate).getTime());
  }, [currentCourse, activeDeckId]);

  const resetData = useCallback(async () => {
    await backendService.deleteCourse();
    setCurrentCourse(null);
    setActiveDeckId(null);
    setCurrentView(View.COURSE);
  }, []);

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
    currentCourse, 
    isLoading,
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