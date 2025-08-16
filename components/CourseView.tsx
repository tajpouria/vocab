
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import AddWordForm from './AddWordForm';
import WordCard from './WordCard';

const CourseView: React.FC = () => {
  const { currentCourse, addDeck, activeDeck, setActiveDeckId } = useAppContext();
  const [newDeckName, setNewDeckName] = useState('');

  const handleAddDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeckName.trim()) {
      addDeck(newDeckName.trim());
      setNewDeckName('');
    }
  };

  if (!currentCourse) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md sticky top-24">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Course</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Learning <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentCourse.learningLanguage.name}</span>
          </p>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Decks</h3>
            <form onSubmit={handleAddDeck} className="flex items-center mt-2 space-x-2">
              <input
                type="text"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="New deck name..."
                className="block w-full px-3 py-2 bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-400
                  focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Add
              </button>
            </form>
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {currentCourse.decks.length > 0 ? currentCourse.decks.map(deck => (
                <button
                  key={deck.id}
                  onClick={() => setActiveDeckId(deck.id)}
                  className={`w-full text-left px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeDeck?.id === deck.id
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {deck.name} ({deck.words.length})
                </button>
              )) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-2">Create your first deck to get started.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        {activeDeck ? (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{activeDeck.name}</h2>
            <div className="mt-4">
                <AddWordForm deckId={activeDeck.id} />
            </div>
            <div className="mt-8 space-y-4">
              {activeDeck.words.slice().reverse().map(word => (
                <WordCard key={word.id} word={word} deckId={activeDeck.id} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300">Select a deck</h3>
            <p className="text-slate-400 dark:text-slate-500 mt-2">Choose a deck from the list or create a new one to add words.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseView;
