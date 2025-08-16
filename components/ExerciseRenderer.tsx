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
    if (!feedback) return `${baseClasses} bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-500`;
    const isCorrectAnswer = option === exercise.correctAnswer;
    const isSelected = option === userAnswer;

    if(isCorrectAnswer) return `${baseClasses} bg-green-100 border-green-400 text-green-800 dark:bg-green-900/50 dark:border-green-500 dark:text-green-300`;
    if(isSelected && !isCorrectAnswer) return `${baseClasses} bg-red-100 border-red-400 text-red-800 dark:bg-red-900/50 dark:border-red-500 dark:text-red-300`;
    
    return `${baseClasses} bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-500 cursor-not-allowed`;
  };

  const renderExercise = () => {
    if (!exercise) return <p>Loading exercise...</p>;

    switch (exercise.type) {
      case ExerciseType.PRONOUNCE_WORD:
      case ExerciseType.PRONOUNCE_SENTENCE:
        const isSentence = exercise.type === ExerciseType.PRONOUNCE_SENTENCE;
        return (
            <div>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">Pronounce the following {isSentence ? 'sentence' : 'word'}:</p>
                <div className="flex items-center justify-center my-6 space-x-4">
                    <h2 className={`font-bold text-center text-indigo-600 dark:text-indigo-400 ${isSentence ? 'text-2xl' : 'text-4xl'}`}>{exercise.question}</h2>
                    <button 
                        onClick={() => handlePronounce(exercise.question)}
                        className="p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 transition-colors flex-shrink-0"
                        aria-label={`Listen to ${exercise.question}`}
                    >
                        <SpeakerIcon className="h-6 w-6" />
                    </button>
                </div>
                
                {recorderError && <p className="text-center text-red-600 dark:text-red-500 mb-4">{recorderError}</p>}
                
                {!audioURL && !isRecording && (
                    <button 
                        onClick={startRecording}
                        className="w-full flex justify-center items-center space-x-2 px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Review Your Pronunciation</h3>
                            <audio src={audioURL} controls className="w-full mt-2" />
                        </div>
                        <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-4">
                           <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">How did you do?</p>
                           <div className="flex justify-center space-x-4">
                                <button 
                                    onClick={() => handleSelfEvaluation(false)}
                                    className="px-6 py-2 border border-slate-300 dark:border-slate-500 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">Translate the following word:</p>
            <h2 className="text-4xl font-bold text-center my-6 text-indigo-600 dark:text-indigo-400">{exercise.question}</h2>
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
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">Complete the sentence:</p>
            <p className="text-2xl text-center my-6 text-slate-700 dark:text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: exercise.question.replace(/___/g, '<span class="font-bold text-indigo-400 dark:text-indigo-500">___</span>') }}/>
            {exercise.translationContext && <p className="text-center text-slate-500 dark:text-slate-400 italic mb-4">"{exercise.translationContext}"</p>}
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
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">Type the missing word:</p>
            <p className="text-2xl text-center my-6 text-slate-700 dark:text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: exercise.question.replace(/___/g, '<span class="font-bold text-indigo-400 dark:text-indigo-500">___</span>') }}/>
            {exercise.translationContext && <p className="text-center text-slate-500 dark:text-slate-400 italic mb-4">"{exercise.translationContext}"</p>}
             <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className={`block w-full text-center text-lg p-3 border-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-semibold
                ${feedback === 'correct' ? 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900/50 dark:border-green-500 dark:text-green-300' :
                  feedback === 'incorrect' ? 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/50 dark:border-red-500 dark:text-red-300' :
                  'border-slate-300 text-slate-800 dark:border-slate-500 dark:text-white dark:bg-slate-700'
                }`}
                disabled={!!feedback}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
              />
              {feedback === 'incorrect' && (
                  <p className="text-center mt-4 text-lg">
                      Correct answer: <span className="font-bold text-green-600 dark:text-green-400">{exercise.correctAnswer}</span>
                  </p>
              )}
          </form>
        );
      default:
        return <p>Unknown exercise type.</p>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/25 transition-all duration-300">
      {renderExercise()}
    </div>
  );
};

export default ExerciseRenderer;