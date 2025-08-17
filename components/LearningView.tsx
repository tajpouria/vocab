import React from 'react';
import { Exercise, Word } from '../types';
import ExerciseRenderer from './ExerciseRenderer';

interface LearningViewProps {
  // Exercise data
  currentExercise: Exercise;
  onComplete: (correct: boolean) => void;
  
  // Progress tracking
  currentIndex: number;
  totalCount: number;
  
  // Display information
  title: string;
  subtitle?: string;
  
  // Navigation
  onBack?: () => void;
  backButtonText?: string;
}

const LearningView: React.FC<LearningViewProps> = ({
  currentExercise,
  onComplete,
  currentIndex,
  totalCount,
  title,
  subtitle,
  onBack,
  backButtonText = "← Back"
}) => {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="text-center mb-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="mb-4 text-sm text-muted-foreground hover:text-foreground"
          >
            {backButtonText}
          </button>
        )}
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
        <p className="text-sm text-muted-foreground">Exercise {currentIndex + 1} of {totalCount}</p>
        <div className="w-full bg-secondary rounded-full h-2.5 mt-2">
          <div 
            className="bg-primary h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
          />
        </div>
      </div>
      <ExerciseRenderer exercise={currentExercise} onComplete={onComplete} />
    </div>
  );
};

export default LearningView;
