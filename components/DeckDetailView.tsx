
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import AddWordForm from './AddWordForm';
import WordCard from './WordCard';
import SearchIcon from './icons/SearchIcon';

const StudySetDetailView: React.FC = () => {
  const { activeStudySet, setActiveStudySetId } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

  const filteredWords = useMemo(() => {
    if (!activeStudySet) return [];
    return activeStudySet.words.filter(word =>
      word.learningWord.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.nativeWord.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice().reverse();
  }, [activeStudySet, searchQuery]);

  if (!activeStudySet) return null;

  return (
    <div>
      <div className="p-4 bg-card sticky top-16 z-[5] border-b border-border">
        <div className="flex items-center">
            <button
                onClick={() => setActiveStudySetId(null)}
                className="p-2 rounded-full hover:bg-secondary mr-2"
                aria-label="Back to study sets"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h2 className="text-xl font-bold text-foreground truncate">{activeStudySet.name}</h2>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <AddWordForm studySetId={activeStudySet.id} />
        </div>

        <div className="relative mb-4">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search words in this study set..."
                className="w-full pl-10 pr-4 py-3 bg-card border-none rounded-lg placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="h-5 w-5 text-muted-foreground" />
            </div>
        </div>
        
        <div className="space-y-2">
          {filteredWords.length > 0 ? (
            filteredWords.map(word => (
              <div key={word.id}>
                {expandedWordId === word.id ? (
                  <WordCard word={word} studySetId={activeStudySet.id} />
                ) : (
                  <button
                    onClick={() => setExpandedWordId(word.id === expandedWordId ? null : word.id)}
                    className="w-full flex justify-between items-center p-4 bg-card rounded-lg hover:bg-secondary transition-colors"
                  >
                    <span className="font-semibold text-card-foreground">{word.learningWord}</span>
                    <span className="text-muted-foreground">{word.nativeWord}</span>
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-card rounded-lg">
                <p className="text-card-foreground">
                    {searchQuery ? 'No words match your search.' : 'This study set is empty.'}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                    {searchQuery ? 'Try a different search term.' : 'Use the form above to add your first word.'}
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudySetDetailView;