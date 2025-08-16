import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { processWord } from '../services/geminiService';
import SpinnerIcon from './icons/SpinnerIcon';
import { EXAMPLE_WORDS } from '../constants';

interface AddWordFormProps {
  studySetId: string;
}

const AddWordForm: React.FC<AddWordFormProps> = ({ studySetId }) => {
  const { currentCourse, addWord } = useAppContext();
  const [word, setWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeholder = currentCourse?.learningLanguage.code && EXAMPLE_WORDS[currentCourse.learningLanguage.code]
    ? `e.g., "${EXAMPLE_WORDS[currentCourse.learningLanguage.code]}"`
    : `e.g., a word in ${currentCourse?.learningLanguage.name || 'the target language'}`;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !currentCourse) return;

    setIsLoading(true);
    setError(null);
    try {
      const processedData = await processWord(word.trim(), currentCourse.learningLanguage, currentCourse.nativeLanguage);
      const result = await addWord(studySetId, processedData);

      if (result.status === 'duplicate') {
        setError(`The word "${word.trim()}" is already in this study set as "${result.learningWord}".`);
        setWord('');
      } else {
        setWord('');
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-card rounded-xl shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="word-input" className="block text-lg font-semibold text-card-foreground mb-2">
            Add a new word
          </label>
          <input
            type="text"
            id="word-input"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder={placeholder}
            className="block w-full rounded-lg p-4 text-base border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring focus:border-ring shadow-sm"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !word.trim()}
          className="relative w-full inline-flex items-center justify-center space-x-2 px-4 py-3 border border-transparent text-base font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <SpinnerIcon /> : <span>Add Word & Generate</span>}
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-destructive text-center">{error}</p>}
    </div>
  );
};

export default AddWordForm;