import React, { useState, useEffect } from 'react';
import { Exercise, ExerciseType } from '../types';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { textToSpeech } from '../services/geminiService';
import { useAppContext } from '../contexts/AppContext';
import SpeakerIcon from './icons/SpeakerIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';

interface ExerciseRendererProps {
  exercise: Exercise;
  onComplete: (correct: boolean) => void;
}

const ExerciseRenderer: React.FC<ExerciseRendererProps> = ({ exercise, onComplete }) => {
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  
  const { isRecording, startRecording, stopRecording, audioURL, error: recorderError } = useAudioRecorder();
  const { currentCourse } = useAppContext();

  useEffect(() => {
    if (exercise) {
      setUserAnswer('');
      setFeedback(null);
      if (exercise.options) {
        // Create unique options by combining exercise.options with correctAnswer, removing duplicates
        const uniqueOptions = Array.from(new Set([...exercise.options, exercise.correctAnswer]));
        setShuffledOptions(uniqueOptions.sort(() => Math.random() - 0.5));
      } else {
        setShuffledOptions([]);
      }
    }
  }, [exercise]);

  // This effect handles automatically playing audio when an exercise loads.
  // Note: This is AUTOMATIC audio playback that happens when exercises first load.
  // Manual pronunciation buttons (speaker icons) are now available in all exercise types for replay.
  useEffect(() => {
    if (exercise && currentCourse) {
      let textToSpeak = '';

      switch (exercise.type) {
        case ExerciseType.TRANSLATE_MC:
        case ExerciseType.PRONOUNCE_WORD:
        case ExerciseType.PRONOUNCE_SENTENCE:
          textToSpeak = exercise.question;
          break;
        case ExerciseType.FILL_BLANK_MC:
        case ExerciseType.FILL_BLANK_TYPE:
          // For fill-in-the-blank, we want to speak the full sentence.
          // We'll prioritize the `sentenceContext` field which should be provided by the AI.
          // As a fallback for older data, we can try to reconstruct the sentence.
          textToSpeak = exercise.sentenceContext || exercise.question.replace(/___/g, exercise.correctAnswer);
          break;
        default:
          break;
      }

      if (textToSpeak) {
        textToSpeech(textToSpeak, currentCourse.learningLanguage.code);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise, currentCourse]);


  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (feedback || !userAnswer.trim()) return;

    const isCorrect = userAnswer.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim();
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    setTimeout(() => {
      onComplete(isCorrect);
    }, 1500);
  };
  
  const handleOptionClick = (option: string) => {
      if (feedback) return;
      setUserAnswer(option);
      const isCorrect = option.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim();
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      setTimeout(() => {
        onComplete(isCorrect);
      }, 1500);
  };
  
  const handleSelfEvaluation = (correct: boolean) => {
      setFeedback(correct ? 'correct' : 'incorrect');
      setTimeout(() => {
        onComplete(correct);
      }, 1000);
  };
  
  const handlePronounce = (text: string) => {
    if(currentCourse) {
        textToSpeech(text, currentCourse.learningLanguage.code);
    }
  };

  const getFeedbackClasses = (baseClasses: string, option?: string) => {
    if (!feedback) return `${baseClasses} bg-background hover:bg-secondary border-border`;
    const isCorrectAnswer = option === exercise.correctAnswer;
    const isSelected = option === userAnswer;

    if(isCorrectAnswer) return `${baseClasses} bg-green-500/20 border-green-500 text-green-400`;
    if(isSelected && !isCorrectAnswer) return `${baseClasses} bg-destructive/20 border-destructive text-destructive`;
    
    return `${baseClasses} bg-secondary/50 border-border/50 text-muted-foreground cursor-not-allowed`;
  };

  const renderExercise = () => {
    if (!exercise) return <p>Loading exercise...</p>;

    switch (exercise.type) {
      case ExerciseType.PRONOUNCE_WORD:
      case ExerciseType.PRONOUNCE_SENTENCE:
        const isSentence = exercise.type === ExerciseType.PRONOUNCE_SENTENCE;
        return (
            <div>
                <p className="text-center text-sm text-muted-foreground px-2">Pronounce the following {isSentence ? 'sentence' : 'word'}:</p>
                <div className="flex flex-col sm:flex-row items-center justify-center my-4 sm:my-6 space-y-2 sm:space-y-0 sm:space-x-4 px-2">
                    <h2 className={`font-bold text-center text-primary break-words ${isSentence ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl'}`}>{exercise.question}</h2>
                    {/* Pronunciation button for manual replay */}
                    <button 
                        onClick={() => handlePronounce(exercise.question)}
                        className="p-3 sm:p-2 rounded-full hover:bg-primary/10 text-primary transition-colors flex-shrink-0 touch-manipulation"
                        aria-label={`Listen to ${exercise.question}`}
                    >
                        <SpeakerIcon className="h-7 w-7 sm:h-6 sm:w-6" />
                    </button>
                </div>
                
                {recorderError && <p className="text-center text-destructive mb-4">{recorderError}</p>}
                
                {!audioURL && !isRecording && (
                    <button 
                        onClick={startRecording}
                        className="w-full flex justify-center items-center space-x-2 px-4 py-4 sm:py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring touch-manipulation"
                    >
                        <MicrophoneIcon />
                        <span>Start Recording</span>
                    </button>
                )}

                {isRecording && (
                    <button 
                        onClick={stopRecording}
                        className="w-full flex justify-center items-center space-x-3 px-4 py-4 sm:py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 touch-manipulation"
                    >
                         <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                        </span>
                        <span>Stop Recording</span>
                    </button>
                )}
                
                {audioURL && !isRecording && (
                    <div className="mt-6 space-y-4">
                        <div className="text-center px-2">
                            <h3 className="font-semibold text-card-foreground text-sm sm:text-base">Review Your Pronunciation</h3>
                            <audio src={audioURL} controls className="w-full mt-2 max-w-md mx-auto" />
                        </div>
                        <div className="text-center border-t border-border pt-4 px-2">
                           <p className="text-sm text-muted-foreground mb-3">How did you do?</p>
                           <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                                <button 
                                    onClick={() => handleSelfEvaluation(false)}
                                    className="px-6 py-3 sm:py-2 border border-border text-sm font-medium rounded-md shadow-sm text-foreground bg-secondary hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring touch-manipulation"
                                >
                                    Try Again
                                </button>
                                <button 
                                    onClick={() => handleSelfEvaluation(true)}
                                    className="px-6 py-3 sm:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 touch-manipulation"
                                >
                                    I Got It Right
                                </button>
                           </div>
                        </div>
                    </div>
                )}
            </div>
        );

      case ExerciseType.TRANSLATE_MC:
        return (
          <div>
            <p className="text-center text-sm text-muted-foreground px-2">Translate the following word:</p>
            <div className="flex flex-col sm:flex-row items-center justify-center my-4 sm:my-6 space-y-2 sm:space-y-0 sm:space-x-4 px-2">
              <h2 className="text-2xl sm:text-4xl font-bold text-center text-primary break-words">{exercise.question}</h2>
              <button 
                onClick={() => handlePronounce(exercise.question)}
                className="p-3 sm:p-2 rounded-full hover:bg-primary/10 text-primary transition-colors flex-shrink-0 touch-manipulation"
                aria-label={`Listen to ${exercise.question}`}
              >
                <SpeakerIcon className="h-7 w-7 sm:h-6 sm:w-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 mt-4 px-2">
              {shuffledOptions.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionClick(option)}
                  disabled={!!feedback}
                  className={getFeedbackClasses("w-full text-left p-4 sm:p-4 rounded-lg border-2 text-base sm:text-lg font-semibold transition-all duration-200 touch-manipulation min-h-[48px] flex items-center", option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case ExerciseType.FILL_BLANK_MC:
        return (
          <div>
            <p className="text-center text-sm text-muted-foreground px-2">Complete the sentence:</p>
            <div className="flex flex-col sm:flex-row items-center justify-center my-4 sm:my-6 space-y-2 sm:space-y-0 sm:space-x-4 px-2">
              <p className="text-lg sm:text-2xl text-center text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: exercise.question.replace(/___/g, '<span class="font-bold text-primary">___</span>') }}/>
              <button 
                onClick={() => handlePronounce(exercise.sentenceContext || exercise.question.replace(/___/g, exercise.correctAnswer))}
                className="p-3 sm:p-2 rounded-full hover:bg-primary/10 text-primary transition-colors flex-shrink-0 touch-manipulation"
                aria-label="Listen to the complete sentence"
              >
                <SpeakerIcon className="h-7 w-7 sm:h-6 sm:w-6" />
              </button>
            </div>
            {exercise.translationContext && <p className="text-center text-muted-foreground italic mb-4 px-2 text-sm sm:text-base">"{exercise.translationContext}"</p>}
            <div className="grid grid-cols-1 gap-3 mt-4 px-2">
              {shuffledOptions.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionClick(option)}
                  disabled={!!feedback}
                  className={getFeedbackClasses("w-full text-left p-4 sm:p-4 rounded-lg border-2 text-base sm:text-lg font-semibold transition-all duration-200 touch-manipulation min-h-[48px] flex items-center", option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case ExerciseType.FILL_BLANK_TYPE:
        return (
          <form onSubmit={handleSubmit}>
            <p className="text-center text-sm text-muted-foreground px-2">Type the missing word:</p>
            <div className="flex flex-col sm:flex-row items-center justify-center my-4 sm:my-6 space-y-2 sm:space-y-0 sm:space-x-4 px-2">
              <p className="text-lg sm:text-2xl text-center text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: exercise.question.replace(/___/g, '<span class="font-bold text-primary">___</span>') }}/>
              <button 
                type="button"
                onClick={() => handlePronounce(exercise.sentenceContext || exercise.question.replace(/___/g, exercise.correctAnswer))}
                className="p-3 sm:p-2 rounded-full hover:bg-primary/10 text-primary transition-colors flex-shrink-0 touch-manipulation"
                aria-label="Listen to the complete sentence"
              >
                <SpeakerIcon className="h-7 w-7 sm:h-6 sm:w-6" />
              </button>
            </div>
            {exercise.translationContext && <p className="text-center text-muted-foreground italic mb-4 px-2 text-sm sm:text-base">"{exercise.translationContext}"</p>}
             <div className="px-2">
               <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className={`block w-full text-center text-base sm:text-lg p-4 sm:p-3 border-2 rounded-md shadow-sm focus:ring-ring focus:border-ring font-semibold min-h-[48px]
                  ${feedback === 'correct' ? 'bg-green-500/20 border-green-500 text-green-400' :
                    feedback === 'incorrect' ? 'bg-destructive/20 border-destructive text-destructive' :
                    'border-input text-foreground bg-background'
                  }`}
                  disabled={!!feedback}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                />
             </div>
              {feedback === 'incorrect' && (
                  <p className="text-center mt-4 text-base sm:text-lg px-2">
                      Correct answer: <span className="font-bold text-green-500">{exercise.correctAnswer}</span>
                  </p>
              )}
          </form>
        );
      default:
        return <p>Unknown exercise type.</p>;
    }
  };

  return (
    <div className="bg-card p-4 sm:p-6 lg:p-8 rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/25 transition-all duration-300 max-w-full overflow-hidden">
      {renderExercise()}
    </div>
  );
};

export default ExerciseRenderer;