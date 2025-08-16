
import React from 'react';
import { useAppContext } from './contexts/AppContext';
import CourseView from './components/CourseView';
import LanguageSelector from './components/LanguageSelector';
import Header from './components/Header';
import PracticeView from './components/PracticeView';
import { View } from './types';
import AuthView from './components/AuthView'; // Import new component

const App: React.FC = () => {
  const { isAuthenticated, currentCourse, currentView, isLoading } = useAppContext();

  const renderView = () => {
    switch (currentView) {
      case View.PRACTICE:
        return <PracticeView />;
      case View.COURSE:
      default:
        return <CourseView />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400">
        <div className="text-center">
            <svg className="animate-spin h-12 w-12 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {!currentCourse ? <LanguageSelector /> : renderView()}
      </main>
    </div>
  );
};

export default App;