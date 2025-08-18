import { useState, useEffect, useCallback } from "react";
import {
  Card,
  createEmptyCard,
  FSRS,
  Rating,
  generatorParameters,
} from "ts-fsrs";

import {
  Course,
  StudySet,
  Word,
  Language,
  SrsData,
  Exercise,
  AddWordResult,
} from "../types";
import { SITE_LANGUAGE } from "../constants";
import { generateExercisesForWord } from "../services/geminiService";
import * as backendService from "../services/backendService";
import * as authService from "../services/authService";

// Initialize FSRS algorithm with default parameters
const params = generatorParameters({ enable_fuzz: true });
const fsrs = new FSRS(params);

// Remove old session key as we now use authService

export const useVocabularyStore = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // App State
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [activeStudySetId, setActiveStudySetId] = useState<string | null>(null);
  const [wordToPractice, setWordToPractice] = useState<Word | null>(null);
  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [highlightedWordId, setHighlightedWordId] = useState<string | null>(
    null
  );
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);
  const [isInLearningMode, setIsInLearningMode] = useState(false);

  // Check for existing session on initial load
  useEffect(() => {
    const validateSession = async () => {
      try {
        if (authService.isAuthenticated()) {
          const sessionData = await authService.validateSession();
          if (sessionData) {
            setUserEmail(sessionData.email);
            setIsAuthenticated(true);
          } else {
            // Session is invalid, clear it
            authService.clearSession();
            setIsAuthenticated(false);
            setUserEmail(null);
          }
        } else {
          setIsAuthenticated(false);
          setUserEmail(null);
        }
      } catch (error) {
        console.error("Could not restore session", error);
        authService.clearSession();
        setIsAuthenticated(false);
        setUserEmail(null);
      } finally {
        setIsAuthLoading(false);
      }
    };
    
    validateSession();
  }, []);

  // Load course data when user logs in
  useEffect(() => {
    const loadData = async () => {
      if (!userEmail || !isAuthenticated) return;
      setIsCourseLoading(true);
      try {
        const course = await backendService.getCourse();
        if (course) {
          setCurrentCourse(course);
        } else {
          // If no course exists for user, clear any old state
          setCurrentCourse(null);
        }
      } catch (error) {
        console.error("Failed to load course from backend", error);
        if (error instanceof Error && error.message === 'Authentication required') {
          // Handle auth errors by logging out
          authService.logout().then(() => {
            setUserEmail(null);
            setIsAuthenticated(false);
            setCurrentCourse(null);
            setActiveStudySetId(null);
          }).catch(console.error);
        }
      } finally {
        setIsCourseLoading(false);
      }
    };
    loadData();
  }, [userEmail, isAuthenticated]);

  // Auth Functions
  const login = useCallback((email: string) => {
    // Note: Session is now handled by authService.verifyOtp
    setUserEmail(email);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    setUserEmail(null);
    setIsAuthenticated(false);
    setCurrentCourse(null);
    setActiveStudySetId(null);
  }, []);

  const createCourse = useCallback(
    async (learningLanguage: Language) => {
      if (!userEmail) return;
      const newCourse: Course = {
        id: Date.now().toString(),
        learningLanguage,
        nativeLanguage: SITE_LANGUAGE,
        studySets: [],
      };
      setCurrentCourse(newCourse);
      setActiveStudySetId(null);
  
      await backendService.saveCourse(newCourse);
    },
    [userEmail]
  );

  const addStudySet = useCallback(
    (name: string) => {
      if (!userEmail) return;
      setCurrentCourse((prevCourse) => {
        if (!prevCourse) return null;
        const newStudySet: StudySet = {
          id: Date.now().toString(),
          name,
          words: [],
        };
        const updatedCourse = {
          ...prevCourse,
          studySets: [...prevCourse.studySets, newStudySet],
        };
        backendService.saveCourse(updatedCourse);
        return updatedCourse;
      });
    },
    [userEmail]
  );

  const addWord = useCallback(
    async (
      studySetId: string,
      wordData: Omit<Word, "id" | "srs" | "exercises">
    ): Promise<AddWordResult> => {
      const course = currentCourse;
      if (!course || !userEmail) {
        throw new Error("No course or user session.");
      }

      const studySet = course.studySets.find((s) => s.id === studySetId);
      if (!studySet) {
        throw new Error("Study set not found.");
      }

      const existingWord = studySet.words.find(
        (w) =>
          w.learningWord.toLowerCase() === wordData.learningWord.toLowerCase()
      );

      if (existingWord) {
        setHighlightedWordId(existingWord.id);
        setTimeout(() => setHighlightedWordId(null), 3000);
        return {
          status: "duplicate",
          wordId: existingWord.id,
          learningWord: existingWord.learningWord,
        };
      }

      const { learningLanguage, nativeLanguage } = course;
      const emptyCard = createEmptyCard();
      const initialSrs: SrsData = {
        ...emptyCard,
        state: emptyCard.state,
      };
      const newWord: Word = {
        ...wordData,
        id: Date.now().toString(),
        srs: initialSrs,
        exercises: [],
      };

      setCurrentCourse((prevCourse) => {
        if (!prevCourse) return null;
        const updatedCourse = {
          ...prevCourse,
          studySets: prevCourse.studySets.map((s) =>
            s.id === studySetId ? { ...s, words: [...s.words, newWord] } : s
          ),
        };
        backendService.saveCourse(updatedCourse);
        return updatedCourse;
      });

      (async () => {
        try {
          const exercises = await generateExercisesForWord(
            wordData.learningWord,
            wordData.nativeWord,
            learningLanguage,
            nativeLanguage
          );
          setCurrentCourse((prevCourse) => {
            if (!prevCourse) return null;
            const courseWithExercises = {
              ...prevCourse,
              studySets: prevCourse.studySets.map((studySet) =>
                studySet.id === studySetId
                  ? {
                      ...studySet,
                      words: studySet.words.map((w) =>
                        w.id === newWord.id ? { ...w, exercises } : w
                      ),
                    }
                  : studySet
              ),
            };
            backendService.saveCourse(courseWithExercises);
            return courseWithExercises;
          });
        } catch (error) {
          console.error(
            "Exercise generation failed, removing word from study set.",
            error
          );
          setCurrentCourse((prevCourse) => {
            if (!prevCourse) return null;
            const courseAfterRollback = {
              ...prevCourse,
              studySets: prevCourse.studySets.map((studySet) =>
                studySet.id === studySetId
                  ? {
                      ...studySet,
                      words: studySet.words.filter((w) => w.id !== newWord.id),
                    }
                  : studySet
              ),
            };
            backendService.saveCourse(courseAfterRollback);
            return courseAfterRollback;
          });
        }
      })();

      // Auto-expand the newly added word
      setExpandedWordId(newWord.id);

      return {
        status: "added",
        wordId: newWord.id,
        learningWord: newWord.learningWord,
      };
    },
    [currentCourse, userEmail]
  );

  const removeWord = useCallback(
    (studySetId: string, wordId: string) => {
      if (!userEmail) return;
      setCurrentCourse((prevCourse) => {
        if (!prevCourse) return null;
        const updatedStudySets = prevCourse.studySets.map((studySet) =>
          studySet.id === studySetId
            ? {
                ...studySet,
                words: studySet.words.filter((word) => word.id !== wordId),
              }
            : studySet
        );
        const updatedCourse = { ...prevCourse, studySets: updatedStudySets };
        backendService.saveCourse(updatedCourse);
        return updatedCourse;
      });
    },
    [userEmail]
  );

  const updateWordSrs = useCallback(
    (wordId: string, studySetId: string, correct: boolean) => {
      if (!userEmail) return;
      setCurrentCourse((prevCourse) => {
        if (!prevCourse) return null;
        const newStudySets = prevCourse.studySets.map((studySet) => {
          if (studySet.id !== studySetId) return studySet;
          const newWords = studySet.words.map((word) => {
            if (word.id !== wordId) return word;

            // Convert SrsData to FSRS Card format
            const card: Card = {
              due:
                word.srs.due instanceof Date
                  ? word.srs.due
                  : new Date(word.srs.due),
              stability: word.srs.stability,
              difficulty: word.srs.difficulty,
              elapsed_days: word.srs.elapsed_days,
              scheduled_days: word.srs.scheduled_days,
              learning_steps: word.srs.learning_steps,
              reps: word.srs.reps,
              lapses: word.srs.lapses,
              state: word.srs.state,
              last_review: word.srs.last_review
                ? word.srs.last_review instanceof Date
                  ? word.srs.last_review
                  : new Date(word.srs.last_review)
                : undefined,
            };

            // Use FSRS algorithm to calculate next review
            const now = new Date();
            const grade = correct ? Rating.Good : Rating.Again;
            const schedulingInfo = fsrs.next(card, now, grade);

            // Convert back to SrsData format
            const newSrs: SrsData = {
              due: schedulingInfo.card.due,
              stability: schedulingInfo.card.stability,
              difficulty: schedulingInfo.card.difficulty,
              elapsed_days: schedulingInfo.card.elapsed_days,
              scheduled_days: schedulingInfo.card.scheduled_days,
              learning_steps: schedulingInfo.card.learning_steps,
              reps: schedulingInfo.card.reps,
              lapses: schedulingInfo.card.lapses,
              state: schedulingInfo.card.state,
              last_review: schedulingInfo.card.last_review,
            };

            return { ...word, srs: newSrs };
          });
          return { ...studySet, words: newWords };
        });
        const updatedCourse = { ...prevCourse, studySets: newStudySets };
        backendService.saveCourse(updatedCourse);
        return updatedCourse;
      });
    },
    [userEmail]
  );

  const getWordsForPractice = useCallback((): Word[] => {
    if (!activeStudySetId || !currentCourse) return [];
    const studySet = currentCourse.studySets.find(
      (d) => d.id === activeStudySetId
    );
    if (!studySet) return [];
    const now = new Date();
    return studySet.words
      .filter(
        (word) => new Date(word.srs.due) <= now && word.exercises.length > 0
      )
      .sort(
        (a, b) => new Date(a.srs.due).getTime() - new Date(b.srs.due).getTime()
      );
  }, [currentCourse, activeStudySetId]);

  const startPracticeForWord = useCallback((word: Word) => {
    setWordToPractice(word);

  }, []);

  const endPractice = useCallback(() => {
    setWordToPractice(null);
  }, []);

  const activeStudySet =
    currentCourse?.studySets.find((d) => d.id === activeStudySetId) || null;

  const customSetActiveStudySetId = useCallback((studySetId: string | null) => {
    setHighlightedWordId(null);
    setExpandedWordId(null);
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

    wordToPractice,
    startPracticeForWord,
    endPractice,
    highlightedWordId,
    expandedWordId,
    setExpandedWordId,
    isInLearningMode,
    setIsInLearningMode,
  };
};
