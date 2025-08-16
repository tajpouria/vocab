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
        setShuffledOptions([...exercise.options, exercise.correctAnswer].sort(() => Math.random() - 0.5));
      } else {
        setShuffledOptions([]);
      }
    }
  }, [exercise]);

  // This new effect handles automatically playing the audio for an exercise.
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
                <p className="text-center text-sm text-muted-foreground">Pronounce the following {isSentence ? 'sentence' : 'word'}:</p>
                <div className="flex items-center justify-center my-6 space-x-4">
                    <h2 className={`font-bold text-center text-primary ${isSentence ? 'text-2xl' : 'text-4xl'}`}>{exercise.question}</h2>
                    <button 
                        onClick={() => handlePronounce(exercise.question)}
                        className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors flex-shrink-0"
                        aria-label={`Listen to ${exercise.question}`}
                    >
                        <SpeakerIcon className="h-6 w-6" />
                    </button>
                </div>
                
                {recorderError && <p className="text-center text-destructive mb-4">{recorderError}</p>}
                
                {!audioURL && !isRecording && (
                    <button 
                        onClick={startRecording}
                        className="w-full flex justify-center items-center space-x-2 px-4 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                    >
                        <MicrophoneIcon />
                        <span>Start Recording</span>
                    </button>
                )}

                {isRecording && (
                    <button 
                        onClick={stopRecording}
                        className="w-full flex justify-center items-center space-x-3 px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                        <div className="text-center">
                            <h3 className="font-semibold text-card-foreground">Review Your Pronunciation</h3>
                            <audio src={audioURL} controls className="w-full mt-2" />
                        </div>
                        <div className="text-center border-t border-border pt-4">
                           <p className="text-sm text-muted-foreground mb-2">How did you do?</p>
                           <div className="flex justify-center space-x-4">
                                <button 
                                    onClick={() => handleSelfEvaluation(false)}
                                    className="px-6 py-2 border border-border text-sm font-medium rounded-md shadow-sm text-foreground bg-secondary hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                                >
                                    Try Again
                                </button>
                                <button 
                                    onClick={() => handleSelfEvaluation(true)}
                                    className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
            <p className="text-center text-sm text-muted-foreground">Translate the following word:</p>
            <h2 className="text-4xl font-bold text-center my-6 text-primary">{exercise.question}</h2>
            <div className="grid grid-cols-1 gap-3 mt-4">
              {shuffledOptions.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionClick(option)}
                  disabled={!!feedback}
                  className={getFeedbackClasses("w-full text-left p-4 rounded-lg border-2 text-lg font-semibold transition-all duration-200", option)}
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
            <p className="text-center text-sm text-muted-foreground">Complete the sentence:</p>
            <p className="text-2xl text-center my-6 text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: exercise.question.replace(/___/g, '<span class="font-bold text-primary">___</span>') }}/>
            {exercise.translationContext && <p className="text-center text-muted-foreground italic mb-4">"{exercise.translationContext}"</p>}
            <div className="grid grid-cols-1 gap-3 mt-4">
              {shuffledOptions.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionClick(option)}
                  disabled={!!feedback}
                  className={getFeedbackClasses("w-full text-left p-4 rounded-lg border-2 text-lg font-semibold transition-all duration-200", option)}
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
            <p className="text-center text-sm text-muted-foreground">Type the missing word:</p>
            <p className="text-2xl text-center my-6 text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: exercise.question.replace(/___/g, '<span class="font-bold text-primary">___</span>') }}/>
            {exercise.translationContext && <p className="text-center text-muted-foreground italic mb-4">"{exercise.translationContext}"</p>}
             <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className={`block w-full text-center text-lg p-3 border-2 rounded-md shadow-sm focus:ring-ring focus:border-ring font-semibold
                ${feedback === 'correct' ? 'bg-green-500/20 border-green-500 text-green-400' :
                  feedback === 'incorrect' ? 'bg-destructive/20 border-destructive text-destructive' :
                  'border-input text-foreground bg-background'
                }`}
                disabled={!!feedback}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
              />
              {feedback === 'incorrect' && (
                  <p className="text-center mt-4 text-lg">
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
    <div className="bg-card p-8 rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/25 transition-all duration-300">
      {renderExercise()}
    </div>
  );
};

export default ExerciseRenderer;