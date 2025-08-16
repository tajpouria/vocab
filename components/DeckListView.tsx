
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const StudySetListView: React.FC = () => {
  const { currentCourse, addStudySet, setActiveStudySetId } = useAppContext();
  const [newStudySetName, setNewStudySetName] = useState('');

  const handleAddStudySet = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudySetName.trim()) {
      addStudySet(newStudySetName.trim());
      setNewStudySetName('');
    }
  };

  if (!currentCourse) return null;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">My Study Sets</h2>
        <p className="text-muted-foreground mt-1">
          Learning <span className="font-semibold text-primary">{currentCourse.learningLanguage.name}</span>
        </p>
      </div>

      <div className="bg-card p-6 rounded-xl shadow-md mb-8">
        <h3 className="text-xl font-semibold text-card-foreground">Create a New Study Set</h3>
        <form onSubmit={handleAddStudySet} className="space-y-4 mt-4">
          <div>
            <label htmlFor="new-studyset-name" className="sr-only">New study set name</label>
            <input
              id="new-studyset-name"
              type="text"
              value={newStudySetName}
              onChange={(e) => setNewStudySetName(e.target.value)}
              placeholder="e.g., 'Travel Vocabulary'"
              className="block w-full rounded-lg p-4 text-base border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring focus:border-ring shadow-sm"
            />
          </div>
          <button 
            type="submit" 
            disabled={!newStudySetName.trim()}
            className="w-full px-4 py-3 bg-primary text-primary-foreground font-semibold text-base rounded-lg shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
          >
            Create Study Set
          </button>
        </form>
      </div>


      <div className="space-y-3">
        {currentCourse.studySets.length > 0 ? currentCourse.studySets.map(studySet => (
          <button
            key={studySet.id}
            onClick={() => setActiveStudySetId(studySet.id)}
            className="w-full text-left p-4 rounded-lg bg-card shadow-md hover:bg-secondary transition-colors flex justify-between items-center"
          >
            <div>
                <p className="font-semibold text-card-foreground text-lg">{studySet.name}</p>
                <p className="text-sm text-muted-foreground">{studySet.words.length} word{studySet.words.length !== 1 ? 's' : ''}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Your study set list is empty.</p>
            <p className="text-muted-foreground mt-1 text-sm">Use the form above to create your first study set.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudySetListView;