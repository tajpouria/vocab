import { useState, useEffect, useCallback } from 'react';
import { Course, StudySet, Word, Language, SrsData, View, Exercise, AddWordResult } from '../types';
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
  const [activeStudySetId, setActiveStudySetId] = useState<string | null>(null);
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
    setActiveStudySetId(null);
    setCurrentView(View.COURSE);
  }, []);


  const createCourse = useCallback(async (learningLanguage: Language) => {
    if (!userEmail) return;
    const newCourse: Course = {
      id: Date.now().toString(),
      learningLanguage,
      nativeLanguage: SITE_LANGUAGE,
      studySets: [],
    };
    setCurrentCourse(newCourse);
    setActiveStudySetId(null);
    setCurrentView(View.COURSE);
    await backendService.saveCourse(userEmail, newCourse);
  }, [userEmail]);

  const addStudySet = useCallback((name: string) => {
    if (!userEmail) return;
    setCurrentCourse(prevCourse => {
      if (!prevCourse) return null;
      const newStudySet: StudySet = { id: Date.now().toString(), name, words: [] };
      const updatedCourse = { ...prevCourse, studySets: [...prevCourse.studySets, newStudySet] };
      backendService.saveCourse(userEmail, updatedCourse);
      return updatedCourse;
    });
  }, [userEmail]);

  const addWord = useCallback(async (studySetId: string, wordData: Omit<Word, 'id' | 'srs' | 'exercises'>): Promise<AddWordResult> => {
    const course = currentCourse;
    if (!course || !userEmail) {
        throw new Error("No course or user session.");
    }
    
    const studySet = course.studySets.find(s => s.id === studySetId);
    if (!studySet) {
        throw new Error("Study set not found.");
    }
    
    const existingWord = studySet.words.find(w => w.learningWord.toLowerCase() === wordData.learningWord.toLowerCase());

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
        const updatedCourse = { ...prevCourse, studySets: prevCourse.studySets.map(s => s.id === studySetId ? { ...s, words: [...s.words, newWord] } : s) };
        backendService.saveCourse(userEmail, updatedCourse);
        return updatedCourse;
    });

    (async () => {
        try {
            const exercises = await generateExercisesForWord(wordData.learningWord, wordData.nativeWord, learningLanguage, nativeLanguage);
            setCurrentCourse(prevCourse => {
                if (!prevCourse) return null;
                const courseWithExercises = { ...prevCourse, studySets: prevCourse.studySets.map(studySet => studySet.id === studySetId ? { ...studySet, words: studySet.words.map(w => w.id === newWord.id ? { ...w, exercises } : w) } : studySet) };
                backendService.saveCourse(userEmail, courseWithExercises);
                return courseWithExercises;
            });
        } catch (error) {
            console.error("Exercise generation failed, removing word from study set.", error);
            setCurrentCourse(prevCourse => {
                if (!prevCourse) return null;
                const courseAfterRollback = { ...prevCourse, studySets: prevCourse.studySets.map(studySet => studySet.id === studySetId ? { ...studySet, words: studySet.words.filter(w => w.id !== newWord.id) } : studySet) };
                backendService.saveCourse(userEmail, courseAfterRollback);
                return courseAfterRollback;
            });
        }
    })();

    return { status: 'added', wordId: newWord.id, learningWord: newWord.learningWord };
  }, [currentCourse, userEmail]);

  const removeWord = useCallback((studySetId: string, wordId: string) => {
    if (!userEmail) return;
    setCurrentCourse(prevCourse => {
      if (!prevCourse) return null;
      const updatedStudySets = prevCourse.studySets.map(studySet => studySet.id === studySetId ? { ...studySet, words: studySet.words.filter(word => word.id !== wordId) } : studySet);
      const updatedCourse = { ...prevCourse, studySets: updatedStudySets };
      backendService.saveCourse(userEmail, updatedCourse);
      return updatedCourse;
    });
  }, [userEmail]);

  const updateWordSrs = useCallback((wordId: string, studySetId: string, correct: boolean) => {
    if (!userEmail) return;
    setCurrentCourse(prevCourse => {
        if (!prevCourse) return null;
        const newStudySets = prevCourse.studySets.map(studySet => {
            if (studySet.id !== studySetId) return studySet;
            const newWords = studySet.words.map(word => {
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
            return { ...studySet, words: newWords };
        });
        const updatedCourse = { ...prevCourse, studySets: newStudySets };
        backendService.saveCourse(userEmail, updatedCourse);
        return updatedCourse;
    });
  }, [userEmail]);

  const getWordsForPractice = useCallback(() => {
    if (!activeStudySetId || !currentCourse) return [];
    const studySet = currentCourse.studySets.find(d => d.id === activeStudySetId);
    if (!studySet) return [];
    const now = new Date();
    return studySet.words.filter(word => new Date(word.srs.reviewDate) <= now && word.exercises.length > 0).sort((a, b) => new Date(a.srs.reviewDate).getTime() - new Date(b.srs.reviewDate).getTime());
  }, [currentCourse, activeStudySetId]);

  const startPracticeForWord = useCallback((word: Word) => {
    setWordToPractice(word);
    setCurrentView(View.REVIEW);
  }, []);

  const endPractice = useCallback(() => {
    setWordToPractice(null);
  }, []);

  const activeStudySet = currentCourse?.studySets.find(d => d.id === activeStudySetId) || null;
  
  const customSetActiveStudySetId = useCallback((studySetId: string | null) => {
    setHighlightedWordId(null);
    setActiveStudySetId(studySetId);
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
    addStudySet, 
    addWord, 
    removeWord,
    updateWordSrs, 
    activeStudySet,
    setActiveStudySetId: customSetActiveStudySetId,
    getWordsForPractice,
    currentView,
    setCurrentView,
    wordToPractice,
    startPracticeForWord,
    endPractice,
    highlightedWordId,
  };
};