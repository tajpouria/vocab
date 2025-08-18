import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import AddWordForm from './AddWordForm';
import WordCard from './WordCard';
import StudySetListView from './DeckListView';
import StudySetDetailView from './DeckDetailView';
import SearchIcon from './icons/SearchIcon';

const CourseView: React.FC = () => {
  const { currentCourse, addStudySet, activeStudySet, setActiveStudySetId, isInLearningMode } = useAppContext();
  const [newStudySetName, setNewStudySetName] = React.useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

  const handleAddStudySet = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudySetName.trim()) {
      addStudySet(newStudySetName.trim());
      setNewStudySetName('');
    }
  };
  
  const handleStudySetChange = (studySetId: string | null) => {
    setActiveStudySetId(studySetId);
    setSearchQuery('');
    setExpandedWordId(null);
  };

  const filteredWords = useMemo(() => {
    if (!activeStudySet) return [];
    return activeStudySet.words.filter(word =>
      word.learningWord.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.nativeWord.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice().reverse();
  }, [activeStudySet, searchQuery]);

  if (!currentCourse) return null;

  // If in learning mode, show the learning interface on all screen sizes
  if (isInLearningMode) {
    return <StudySetDetailView />;
  }

  return (
    <>
      {/* Desktop View */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-xl shadow-md sticky top-24">
            <h2 className="text-2xl font-bold text-card-foreground">My Course</h2>
            <p className="text-muted-foreground mt-1">
              Learning <span className="font-semibold text-primary">{currentCourse.learningLanguage.name}</span>
            </p>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-card-foreground">Study Sets</h3>
              <form onSubmit={handleAddStudySet} className="flex items-center mt-2 space-x-2">
                <input
                  type="text"
                  value={newStudySetName}
                  onChange={(e) => setNewStudySetName(e.target.value)}
                  placeholder="New study set name..."
                  className="block w-full px-3 py-2 bg-input/20 text-foreground border border-input rounded-md text-sm shadow-sm placeholder:text-muted-foreground
                    focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                />
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring">
                  Add
                </button>
              </form>
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {currentCourse.studySets.length > 0 ? currentCourse.studySets.map(studySet => (
                  <button
                    key={studySet.id}
                    onClick={() => handleStudySetChange(studySet.id)}
                    className={`w-full text-left px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeStudySet?.id === studySet.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {studySet.name} ({studySet.words.length})
                  </button>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-2">Create your first study set to get started.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {activeStudySet ? (
            <div>
              <h2 className="text-2xl font-bold text-foreground">{activeStudySet.name}</h2>
              <div className="mt-4">
                  <AddWordForm studySetId={activeStudySet.id} />
              </div>

              <div className="mt-8">
                  <div className="relative mb-4">
                      <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search words..."
                          className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg placeholder:text-muted-foreground focus:ring-ring focus:border-ring"
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
          ) : (
            <div className="flex flex-col items-center justify-center h-96 bg-card rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-card-foreground">Select a study set</h3>
              <p className="text-muted-foreground mt-2">Choose a study set from the list or create a new one to add words.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile View */}
      <div className="lg:hidden -m-4 sm:-m-6 lg:-m-8">
        {!activeStudySet ? (
          <StudySetListView />
        ) : (
          <StudySetDetailView />
        )}
      </div>
    </>
  );
};

export default CourseView;