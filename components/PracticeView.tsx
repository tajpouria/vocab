import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Word, View, Exercise } from '../types';
import ExerciseRenderer from './ExerciseRenderer';

const ReviewView: React.FC = () => {
  const { 
    currentCourse, 
    activeStudySet, 
    getWordsForPractice, 
    setActiveStudySetId, 
    updateWordSrs, 
    setCurrentView,
    wordToPractice,
    endPractice,
  } = useAppContext();

  // State for study set practice
  const [practiceQueue, setPracticeQueue] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [currentExerciseForStudySetMode, setCurrentExerciseForStudySetMode] = useState<Exercise | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  // State for single-word practice
  const [exerciseQueue, setExerciseQueue] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<boolean[]>([]);
  const [isWordSessionComplete, setIsWordSessionComplete] = useState(false);

  // Memo for words ready in study set
  const wordsReadyForPractice = useMemo(() => {
    if (!activeStudySet) return 0;
    const now = new Date();
    return activeStudySet.words.filter(w => new Date(w.srs.reviewDate) <= now && w.exercises.length > 0).length;
  }, [activeStudySet]);

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

  // Effect for study set practice setup
  useEffect(() => {
    if (sessionStarted && !wordToPractice) {
      const queue = getWordsForPractice();
      setPracticeQueue(queue);
      const firstWord = queue[0] || null;
      setCurrentWord(firstWord);
      if (firstWord?.exercises.length) {
        setCurrentExerciseForStudySetMode(firstWord.exercises[Math.floor(Math.random() * firstWord.exercises.length)]);
      }
    }
  }, [sessionStarted, getWordsForPractice, wordToPractice]);

  const handleStartSession = () => {
    if (wordsReadyForPractice > 0) {
      setSessionStarted(true);
    }
  };

  const handleNextWordForStudySet = (correct: boolean) => {
    if (currentWord && activeStudySet) {
      updateWordSrs(currentWord.id, activeStudySet.id, correct);
      
      const newQueue = practiceQueue.slice(1);
      setPracticeQueue(newQueue);
      const nextWord = newQueue[0] || null;
      setCurrentWord(nextWord);

      if (nextWord?.exercises.length) {
        setCurrentExerciseForStudySetMode(nextWord.exercises[Math.floor(Math.random() * nextWord.exercises.length)]);
      } else {
        setCurrentExerciseForStudySetMode(null);
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
        
        let studySetId = '';
        currentCourse?.studySets.forEach(studySet => {
            if (studySet.words.some(w => w.id === wordToPractice!.id)) {
                studySetId = studySet.id;
            }
        });

        if (studySetId) {
            updateWordSrs(wordToPractice!.id, studySetId, wasSuccessful);
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
          <div className="bg-card p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-card-foreground">Word Learned!</h2>
            <p className="mt-2 text-muted-foreground">You got {sessionResults.filter(r => r).length} out of {exerciseQueue.length} exercises correct.</p>
            <button
              onClick={handleFinishWordSession}
              className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
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
          <h3 className="text-lg font-semibold text-foreground">Learning: <span className="text-primary font-bold">{wordToPractice.learningWord}</span></h3>
          <p className="text-sm text-muted-foreground">Exercise {currentExerciseIndex + 1} of {exerciseQueue.length}</p>
          <div className="w-full bg-secondary rounded-full h-2.5 mt-2">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${((currentExerciseIndex + 1) / exerciseQueue.length) * 100}%` }}></div>
          </div>
        </div>
        <ExerciseRenderer exercise={currentExercise} onComplete={handleNextExerciseForWord} />
      </div>
    );
  }

  // Study set practice mode UI
  if (!sessionStarted) {
    if (currentCourse.studySets.length === 0) {
      return (
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-card-foreground">No Study Sets to Review</h2>
            <p className="mt-2 text-muted-foreground">You need to create a study set and add some words first.</p>
            <button onClick={() => setCurrentView(View.COURSE)} className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring">
              Go to Course
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-card-foreground">Review Session</h2>
          <div className="mt-4">
            <label htmlFor="studyset-select" className="block text-sm font-medium text-muted-foreground">Select a study set to review</label>
            <select id="studyset-select" name="studyset-select" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-input bg-background text-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm rounded-md" value={activeStudySet?.id || ''} onChange={(e) => setActiveStudySetId(e.target.value)}>
              <option value="" disabled>-- Select Study Set --</option>
              {currentCourse.studySets.map(studySet => (<option key={studySet.id} value={studySet.id}>{studySet.name}</option>))}
            </select>
          </div>
          {activeStudySet && (
            <div className="mt-6 text-center">
              <p className="text-lg text-muted-foreground">{wordsReadyForPractice} words ready for review.</p>
              <button onClick={handleStartSession} disabled={wordsReadyForPractice === 0} className="mt-4 w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed">
                {wordsReadyForPractice > 0 ? 'Start Reviewing' : 'No words to review'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentWord || !currentExerciseForStudySetMode) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-card p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-card-foreground">Session Complete!</h2>
          <p className="mt-2 text-muted-foreground">Great job! You've reviewed all available words for now.</p>
          <button onClick={() => { setSessionStarted(false); setActiveStudySetId(activeStudySet?.id || null); }} className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring">
            Back to Review Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ExerciseRenderer exercise={currentExerciseForStudySetMode} onComplete={handleNextWordForStudySet} />
    </div>
  );
};

export default ReviewView;