import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { processWord } from '../services/geminiService';
import SpinnerIcon from './icons/SpinnerIcon';

interface AddWordFormProps {
  deckId: string;
}

const AddWordForm: React.FC<AddWordFormProps> = ({ deckId }) => {
  const { currentCourse, addWord } = useAppContext();
  const [word, setWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !currentCourse) return;

    setIsLoading(true);
    setError(null);
    try {
      const processedData = await processWord(word.trim(), currentCourse.learningLanguage, currentCourse.nativeLanguage);
      const result = await addWord(deckId, processedData);

      if (result.status === 'duplicate') {
        setError(`The word "${word.trim()}" is already in your deck as "${result.learningWord}".`);
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
    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
      <form onSubmit={handleSubmit}>
        <label htmlFor="word-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Add a new word to your deck
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <div className="relative flex items-stretch flex-grow focus-within:z-10">
            <input
              type="text"
              id="word-input"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g., 'hello' or 'hola'"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md pl-4 sm:text-sm border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !word.trim()}
            className="relative -ml-px inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {isLoading ? <SpinnerIcon /> : <span>Add Word</span>}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-500">{error}</p>}
      </form>
    </div>
  );
};

export default AddWordForm;
