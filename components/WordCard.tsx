import React from 'react';
import { Word } from '../types';
import { useAppContext } from '../contexts/AppContext';
import SpeakerIcon from './icons/SpeakerIcon';
import TrashIcon from './icons/TrashIcon';
import { textToSpeech } from '../services/geminiService';

interface WordCardProps {
  word: Word;
  deckId: string;
}

const WordCard: React.FC<WordCardProps> = ({ word, deckId }) => {
    const { currentCourse, startPracticeForWord, removeWord, highlightedWordId } = useAppContext();
    const cardRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (highlightedWordId === word.id && cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [highlightedWordId, word.id]);

    if (!currentCourse) return null;

    const handlePronounce = (text: string) => {
        textToSpeech(text, currentCourse.learningLanguage.code);
    };

    const handleRemoveWord = () => {
        if (window.confirm(`Are you sure you want to remove "${word.learningWord}"? This action cannot be undone.`)) {
            removeWord(deckId, word.id);
        }
    };

    const canLearn = word.exercises.length > 0;
    const isHighlighted = highlightedWordId === word.id;

    return (
        <div 
            ref={cardRef} 
            className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md transition-all duration-500 ease-in-out ${
                isHighlighted ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900 shadow-indigo-200/50 dark:shadow-indigo-900/50' : ''
            }`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{word.learningWord}</h3>
                    <p className="text-lg text-slate-600 dark:text-slate-300">{word.nativeWord}</p>
                </div>
                <div className="flex items-center space-x-1">
                    <button 
                        onClick={() => handlePronounce(word.learningWord)} 
                        className="p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 transition-colors"
                        aria-label={`Listen to ${word.learningWord}`}
                    >
                        <SpeakerIcon className="h-6 w-6" />
                    </button>
                    <button 
                        onClick={handleRemoveWord}
                        className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-500 transition-colors"
                        aria-label={`Remove ${word.learningWord}`}
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">Examples:</h4>
                <ul className="mt-2 space-y-3 text-sm">
                    {word.examples.map((ex, index) => (
                        <li key={index} className="flex items-start justify-between space-x-2">
                            <div className="flex-grow">
                                <p className="text-slate-800 dark:text-slate-200">{ex.sentence}</p>
                                <p className="text-slate-500 dark:text-slate-400 italic">{ex.translation}</p>
                            </div>
                            <button
                                onClick={() => handlePronounce(ex.sentence)}
                                className="p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-500 dark:text-indigo-400 transition-colors flex-shrink-0 mt-0.5"
                                aria-label={`Listen to example: ${ex.sentence}`}
                            >
                                <SpeakerIcon className="h-5 w-5" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
             <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                {word.exercises.length === 0 ? (
                    <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                        <svg className="animate-spin h-4 w-4 text-indigo-500 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8_0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating exercises...</span>
                    </div>
                ) : <div />}
                <button 
                    onClick={() => startPracticeForWord(word)}
                    disabled={!canLearn}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    Learn
                </button>
             </div>
        </div>
    );
};

export default WordCard;
