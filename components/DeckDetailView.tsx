import React, { useState, useMemo, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import { Word, Exercise } from "../types";
import AddWordForm from "./AddWordForm";
import WordCard from "./WordCard";
import SearchIcon from "./icons/SearchIcon";
import LearningView from "./LearningView";
import CompletionView from "./CompletionView";

const StudySetDetailView: React.FC = () => {
  const {
    activeStudySet,
    expandedWordId,
    setExpandedWordId,
    getWordsForPractice,
    updateWordSrs,
    wordToPractice,
    startPracticeForWord,
    endPractice,
    setIsInLearningMode,
  } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");

  // Review state
  const [isReviewing, setIsReviewing] = useState(false);
  const [practiceQueue, setPracticeQueue] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);

  // Single-word practice state
  const [exerciseQueue, setExerciseQueue] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<boolean[]>([]);
  const [isWordSessionComplete, setIsWordSessionComplete] = useState(false);

  const filteredWords = useMemo(() => {
    if (!activeStudySet) return [];
    return activeStudySet.words
      .filter(
        (word) =>
          word.learningWord.toLowerCase().includes(searchQuery.toLowerCase()) ||
          word.nativeWord.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice()
      .reverse();
  }, [activeStudySet, searchQuery]);

  const wordsReadyForPractice = useMemo(() => {
    if (!activeStudySet) return 0;
    const now = new Date();
    return activeStudySet.words.filter(
      (w) => new Date(w.srs.due) <= now && w.exercises.length > 0
    ).length;
  }, [activeStudySet]);

  // Effect for single-word practice setup
  useEffect(() => {
    if (wordToPractice) {
      const shuffledExercises = [...wordToPractice.exercises].sort(
        () => Math.random() - 0.5
      );
      setExerciseQueue(shuffledExercises);
      setCurrentExerciseIndex(0);
      setSessionResults([]);
      setIsWordSessionComplete(false);
    }
  }, [wordToPractice]);

  // Effect for study set practice setup
  useEffect(() => {
    if (isReviewing && !wordToPractice && activeStudySet) {
      const queue = getWordsForPractice();
      setPracticeQueue(queue);
      const firstWord = queue[0] || null;
      setCurrentWord(firstWord);
      if (firstWord?.exercises.length) {
        setCurrentExercise(
          firstWord.exercises[
            Math.floor(Math.random() * firstWord.exercises.length)
          ]
        );
      }
    }
  }, [isReviewing, getWordsForPractice, wordToPractice, activeStudySet]);

  const handleStartReview = () => {
    if (wordsReadyForPractice > 0) {
      setIsReviewing(true);
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
        setCurrentExercise(
          nextWord.exercises[
            Math.floor(Math.random() * nextWord.exercises.length)
          ]
        );
      } else {
        setCurrentExercise(null);
      }

      if (newQueue.length === 0) {
        setIsReviewing(false);
      }
    }
  };

  const handleNextExerciseForWord = (correct: boolean) => {
    const newResults = [...sessionResults, correct];
    setSessionResults(newResults);

    if (currentExerciseIndex + 1 < exerciseQueue.length) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      const correctCount = newResults.filter((r) => r).length;
      const wasSuccessful = correctCount / newResults.length >= 0.5;

      if (activeStudySet && wordToPractice) {
        updateWordSrs(wordToPractice.id, activeStudySet.id, wasSuccessful);
      }
      setIsWordSessionComplete(true);
    }
  };

  const handleFinishWordSession = () => {
    endPractice();
    setIsWordSessionComplete(false);
  };

  // Auto-return to study set after word session completion
  useEffect(() => {
    if (isWordSessionComplete) {
      const timer = setTimeout(() => {
        handleFinishWordSession();
      }, 3000); // Show completion screen for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isWordSessionComplete]);

  // Auto-return to study set after review completion
  useEffect(() => {
    if (isReviewing && !currentWord && !currentExercise) {
      const timer = setTimeout(() => {
        handleStopReview();
      }, 3000); // Show completion screen for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isReviewing, currentWord, currentExercise]);

  // Set learning mode when in word practice or review
  useEffect(() => {
    const inLearningMode = !!wordToPractice || isReviewing;
    setIsInLearningMode(inLearningMode);
  }, [wordToPractice, isReviewing, setIsInLearningMode]);

  const handleStopReview = () => {
    setIsReviewing(false);
    setPracticeQueue([]);
    setCurrentWord(null);
    setCurrentExercise(null);
  };

  if (!activeStudySet) return null;

  // Single-word practice mode
  if (wordToPractice) {
    if (isWordSessionComplete) {
      return (
        <CompletionView
          title="Word Learned!"
          message="Great job! You've completed all exercises for this word."
          successCount={sessionResults.filter((r) => r).length}
          totalCount={exerciseQueue.length}
        />
      );
    }

    const currentExerciseForWord = exerciseQueue[currentExerciseIndex];
    if (!currentExerciseForWord)
      return <div className="text-center p-8">Loading exercises...</div>;

    return (
      <LearningView
        currentExercise={currentExerciseForWord}
        onComplete={handleNextExerciseForWord}
        currentIndex={currentExerciseIndex}
        totalCount={exerciseQueue.length}
        title={`Learning`}
        onBack={handleFinishWordSession}
        backButtonText="← Back to Study Set"
      />
    );
  }

  // Study set review mode
  if (isReviewing) {
    if (!currentWord || !currentExercise) {
      return (
        <CompletionView
          title="Review Complete!"
          message="Great job! You've reviewed all available words for now."
        />
      );
    }

    // Calculate current position in the original queue
    const totalWords = practiceQueue.length + (currentWord ? 1 : 0);
    const currentPosition = totalWords - practiceQueue.length;

    return (
      <LearningView
        currentExercise={currentExercise}
        onComplete={handleNextWordForStudySet}
        currentIndex={currentPosition - 1}
        totalCount={totalWords}
        title={`Reviewing: ${activeStudySet.name}`}
        subtitle={`${practiceQueue.length} words remaining`}
        onBack={handleStopReview}
        backButtonText="← Back to Study Set"
      />
    );
  }

  // Default study set view
  return (
    <div>
      <div className="p-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">
            {activeStudySet.name}
          </h2>
        </div>

        {/* Review Button */}
        <div className="mb-6">
          <div className="bg-card p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  Review Words
                </h3>
                <p className="text-sm text-muted-foreground">
                  {wordsReadyForPractice} words ready for review
                </p>
              </div>
              <button
                onClick={handleStartReview}
                disabled={wordsReadyForPractice === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {wordsReadyForPractice > 0
                  ? "Start Review"
                  : "No words to review"}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <AddWordForm studySetId={activeStudySet.id} />
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search words in this study set..."
            className="w-full pl-10 pr-4 py-3 bg-card border-none rounded-lg placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          {filteredWords.length > 0 ? (
            filteredWords.map((word) => (
              <div key={word.id}>
                {expandedWordId === word.id ? (
                  <WordCard word={word} studySetId={activeStudySet.id} />
                ) : (
                  <button
                    onClick={() =>
                      setExpandedWordId(
                        word.id === expandedWordId ? null : word.id
                      )
                    }
                    className="w-full flex justify-between items-center p-3 sm:p-4 bg-card rounded-lg hover:bg-secondary transition-colors touch-manipulation"
                  >
                    <span className="font-semibold text-card-foreground text-left break-words">
                      {word.learningWord}
                    </span>
                    <span className="text-muted-foreground text-right break-words ml-2 flex-shrink-0">
                      {word.nativeWord}
                    </span>
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-card rounded-lg">
              <p className="text-card-foreground">
                {searchQuery
                  ? "No words match your search."
                  : "This study set is empty."}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery
                  ? "Try a different search term."
                  : "Use the form above to add your first word."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudySetDetailView;
