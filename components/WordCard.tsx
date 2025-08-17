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

    // Helper function to get human-readable SRS stats
    const getSrsStats = () => {
        const srs = word.srs;
        const now = new Date();
        const dueDate = new Date(srs.due);
        const lastReview = srs.last_review ? new Date(srs.last_review) : null;
        
        // Calculate time until due
        const timeDiff = dueDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Get status based on state
        const getStatus = () => {
            switch (srs.state) {
                case 0: return { text: 'New', color: 'text-blue-600' };
                case 1: return { text: 'Learning', color: 'text-yellow-600' };
                case 2: return { text: 'Review', color: 'text-green-600' };
                case 3: return { text: 'Relearning', color: 'text-orange-600' };
                default: return { text: 'Unknown', color: 'text-gray-600' };
            }
        };
        
        // Get due status
        const getDueStatus = () => {
            if (daysDiff < 0) {
                return { text: `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''}`, color: 'text-red-600' };
            } else if (daysDiff === 0) {
                return { text: 'Due today', color: 'text-orange-600' };
            } else if (daysDiff === 1) {
                return { text: 'Due tomorrow', color: 'text-yellow-600' };
            } else {
                return { text: `Due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`, color: 'text-green-600' };
            }
        };
        
        const status = getStatus();
        const dueStatus = getDueStatus();
        
        return {
            status,
            dueStatus,
            reviewCount: srs.reps,
            successRate: srs.reps > 0 ? Math.round(((srs.reps - srs.lapses) / srs.reps) * 100) : 0,
            lastReview: lastReview ? lastReview.toLocaleDateString() : 'Never',
            hasBeenReviewed: srs.reps > 0
        };
    };

    const srsStats = getSrsStats();

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
            className={`bg-card p-4 sm:p-6 rounded-xl shadow-md transition-all duration-500 ease-in-out ${
                isHighlighted ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-background' : ''
            }`}
        >
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-primary break-words">{word.learningWord}</h3>
                    <p className="text-base sm:text-lg text-muted-foreground break-words">{word.nativeWord}</p>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                    <button 
                        onClick={() => handlePronounce(word.learningWord)} 
                        className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors touch-manipulation"
                        aria-label={`Listen to ${word.learningWord}`}
                    >
                        <SpeakerIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                    <button 
                        onClick={handleRemoveWord}
                        className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors touch-manipulation"
                        aria-label={`Remove ${word.learningWord}`}
                    >
                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>
            </div>
            <div className="mt-4 border-t border-border pt-4">
                <h4 className="font-semibold text-card-foreground text-sm sm:text-base">Examples:</h4>
                <ul className="mt-2 space-y-3 text-sm">
                    {word.examples.map((ex, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-card-foreground break-words">{ex.sentence}</p>
                                <p className="text-muted-foreground italic break-words mt-1">{ex.translation}</p>
                            </div>
                            <button
                                onClick={() => handlePronounce(ex.sentence)}
                                className="p-1.5 sm:p-1 rounded-full hover:bg-primary/10 text-primary transition-colors flex-shrink-0 mt-0.5 touch-manipulation"
                                aria-label={`Listen to example: ${ex.sentence}`}
                            >
                                <SpeakerIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            
            {/* SRS Stats Section */}
            <div className="mt-4 border-t border-border pt-4">
                <h4 className="font-semibold text-card-foreground mb-3 text-sm sm:text-base">Learning Progress:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={`font-medium ${srsStats.status.color}`}>
                                {srsStats.status.text}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Next review:</span>
                            <span className={`font-medium ${srsStats.dueStatus.color} text-right`}>
                                {srsStats.dueStatus.text}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Reviews:</span>
                            <span className="font-medium text-card-foreground">
                                {srsStats.reviewCount}
                            </span>
                        </div>
                        {srsStats.hasBeenReviewed && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Success rate:</span>
                                <span className={`font-medium ${srsStats.successRate >= 80 ? 'text-green-600' : srsStats.successRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {srsStats.successRate}%
                                </span>
                            </div>
                        )}
                        {!srsStats.hasBeenReviewed && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Last review:</span>
                                <span className="font-medium text-muted-foreground">
                                    {srsStats.lastReview}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
             <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                {word.exercises.length === 0 ? (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating exercises...</span>
                    </div>
                ) : <div className="hidden sm:block" />}
                <button 
                    onClick={() => startPracticeForWord(word)}
                    disabled={!canLearn}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 sm:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed touch-manipulation"
                >
                    Learn
                </button>
             </div>
        </div>
    );
};

export default WordCard;