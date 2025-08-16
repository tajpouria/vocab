import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Word, View, Exercise } from '../types';
import ExerciseRenderer from './ExerciseRenderer';

const PracticeView: React.FC = () => {
  const { 
    currentCourse, 
    activeDeck, 
    getWordsForPractice, 
    setActiveDeckId, 
    updateWordSrs, 
    setCurrentView,
    wordToPractice,
    endPractice,
  } = useAppContext();

  // State for deck practice
  const [practiceQueue, setPracticeQueue] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [currentExerciseForDeckMode, setCurrentExerciseForDeckMode] = useState<Exercise | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  // State for single-word practice
  const [exerciseQueue, setExerciseQueue] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<boolean[]>([]);
  const [isWordSessionComplete, setIsWordSessionComplete] = useState(false);

  // Memo for words ready in deck
  const wordsReadyForPractice = useMemo(() => {
    if (!activeDeck) return 0;
    const now = new Date();
    return activeDeck.words.filter(w => new Date(w.srs.reviewDate) <= now && w.exercises.length > 0).length;
  }, [activeDeck]);

  // Effect for single-word practice setup
  useEffect(() => {
    if (wordToPractice) {
      const shuffledExercises = [...wordToPractice.exercises].sort(() => Math.random() - 0.5);
      setExerciseQueue(shuffledExercises);
      setCurrentExerciseIndex(0);
      setSessionResults([]);
      setIsWordSessionComplete(false);
    }
  }, [wordToPractice]);

  // Effect for deck practice setup
  useEffect(() => {
    if (sessionStarted && !wordToPractice) {
      const queue = getWordsForPractice();
      setPracticeQueue(queue);
      const firstWord = queue[0] || null;
      setCurrentWord(firstWord);
      if (firstWord?.exercises.length) {
        setCurrentExerciseForDeckMode(firstWord.exercises[Math.floor(Math.random() * firstWord.exercises.length)]);
      }
    }
  }, [sessionStarted, getWordsForPractice, wordToPractice]);

  const handleStartSession = () => {
    if (wordsReadyForPractice > 0) {
      setSessionStarted(true);
    }
  };

  const handleNextWordForDeck = (correct: boolean) => {
    if (currentWord && activeDeck) {
      updateWordSrs(currentWord.id, activeDeck.id, correct);
      
      const newQueue = practiceQueue.slice(1);
      setPracticeQueue(newQueue);
      const nextWord = newQueue[0] || null;
      setCurrentWord(nextWord);

      if (nextWord?.exercises.length) {
        setCurrentExerciseForDeckMode(nextWord.exercises[Math.floor(Math.random() * nextWord.exercises.length)]);
      } else {
        setCurrentExerciseForDeckMode(null);
      }
      
      if(newQueue.length === 0){
          setSessionStarted(false);
      }
    }
  };

  const handleNextExerciseForWord = (correct: boolean) => {
    const newResults = [...sessionResults, correct];
    setSessionResults(newResults);

    if (currentExerciseIndex + 1 < exerciseQueue.length) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
        const correctCount = newResults.filter(r => r).length;
        const wasSuccessful = correctCount / newResults.length >= 0.5;
        
        let deckId = '';
        currentCourse?.decks.forEach(deck => {
            if (deck.words.some(w => w.id === wordToPractice!.id)) {
                deckId = deck.id;
            }
        });

        if (deckId) {
            updateWordSrs(wordToPractice!.id, deckId, wasSuccessful);
        }
        setIsWordSessionComplete(true);
    }
  };

  const handleFinishWordSession = () => {
    endPractice();
    setCurrentView(View.COURSE);
  };
  
  if (!currentCourse) return null;

  // Single-word practice mode
  if (wordToPractice) {
    if (isWordSessionComplete) {
      return (
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Word Learned!</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">You got {sessionResults.filter(r => r).length} out of {exerciseQueue.length} exercises correct.</p>
            <button
              onClick={handleFinishWordSession}
              className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Course
            </button>
          </div>
        </div>
      );
    }

    const currentExercise = exerciseQueue[currentExerciseIndex];
    if (!currentExercise) return <div className="text-center p-8">Loading exercises...</div>;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Learning: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{wordToPractice.learningWord}</span></h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Exercise {currentExerciseIndex + 1} of {exerciseQueue.length}</p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-2">
            <div className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full" style={{ width: `${((currentExerciseIndex + 1) / exerciseQueue.length) * 100}%` }}></div>
          </div>
        </div>
        <ExerciseRenderer exercise={currentExercise} onComplete={handleNextExerciseForWord} />
      </div>
    );
  }

  // Deck practice mode UI
  if (!sessionStarted) {
    if (currentCourse.decks.length === 0) {
      return (
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">No Decks to Practice</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">You need to create a deck and add some words first.</p>
            <button onClick={() => setCurrentView(View.COURSE)} className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Go to Course
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Practice Session</h2>
          <div className="mt-4">
            <label htmlFor="deck-select" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Select a deck to practice</label>
            <select id="deck-select" name="deck-select" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" value={activeDeck?.id || ''} onChange={(e) => setActiveDeckId(e.target.value)}>
              <option value="" disabled>-- Select Deck --</option>
              {currentCourse.decks.map(deck => (<option key={deck.id} value={deck.id}>{deck.name}</option>))}
            </select>
          </div>
          {activeDeck && (
            <div className="mt-6 text-center">
              <p className="text-lg text-slate-600 dark:text-slate-300">{wordsReadyForPractice} words ready for review.</p>
              <button onClick={handleStartSession} disabled={wordsReadyForPractice === 0} className="mt-4 w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 dark:disabled:text-slate-400 disabled:cursor-not-allowed">
                {wordsReadyForPractice > 0 ? 'Start Practicing' : 'No words to practice'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentWord || !currentExerciseForDeckMode) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Session Complete!</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Great job! You've reviewed all available words for now.</p>
          <button onClick={() => { setSessionStarted(false); setActiveDeckId(activeDeck?.id || null); }} className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Back to Practice Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ExerciseRenderer exercise={currentExerciseForDeckMode} onComplete={handleNextWordForDeck} />
    </div>
  );
};

export default PracticeView;