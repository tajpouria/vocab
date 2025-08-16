import React from 'react';
import { Word } from '../types';
import { useAppContext } from '../contexts/AppContext';
import SpeakerIcon from './icons/SpeakerIcon';
import TrashIcon from './icons/TrashIcon';
import { textToSpeech } from '../services/geminiService';

interface WordCardProps {
  word: Word;
  studySetId: string;
}

const WordCard: React.FC<WordCardProps> = ({ word, studySetId }) => {
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
            removeWord(studySetId, word.id);
        }
    };

    const canLearn = word.exercises.length > 0;
    const isHighlighted = highlightedWordId === word.id;

    return (
        <div 
            ref={cardRef} 
            className={`bg-card p-6 rounded-xl shadow-md transition-all duration-500 ease-in-out ${
                isHighlighted ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-background' : ''
            }`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-bold text-primary">{word.learningWord}</h3>
                    <p className="text-lg text-muted-foreground">{word.nativeWord}</p>
                </div>
                <div className="flex items-center space-x-1">
                    <button 
                        onClick={() => handlePronounce(word.learningWord)} 
                        className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
                        aria-label={`Listen to ${word.learningWord}`}
                    >
                        <SpeakerIcon className="h-6 w-6" />
                    </button>
                    <button 
                        onClick={handleRemoveWord}
                        className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Remove ${word.learningWord}`}
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div className="mt-4 border-t border-border pt-4">
                <h4 className="font-semibold text-card-foreground">Examples:</h4>
                <ul className="mt-2 space-y-3 text-sm">
                    {word.examples.map((ex, index) => (
                        <li key={index} className="flex items-start justify-between space-x-2">
                            <div className="flex-grow">
                                <p className="text-card-foreground">{ex.sentence}</p>
                                <p className="text-muted-foreground italic">{ex.translation}</p>
                            </div>
                            <button
                                onClick={() => handlePronounce(ex.sentence)}
                                className="p-1 rounded-full hover:bg-primary/10 text-primary transition-colors flex-shrink-0 mt-0.5"
                                aria-label={`Listen to example: ${ex.sentence}`}
                            >
                                <SpeakerIcon className="h-5 w-5" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
             <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                {word.exercises.length === 0 ? (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating exercises...</span>
                    </div>
                ) : <div />}
                <button 
                    onClick={() => startPracticeForWord(word)}
                    disabled={!canLearn}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                    Learn
                </button>
             </div>
        </div>
    );
};

export default WordCard;