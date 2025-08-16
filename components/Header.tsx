import React from 'react';
import { SITE_LANGUAGE } from '../constants';
import { useAppContext } from '../contexts/AppContext';
import { View } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

const Header: React.FC = () => {
  const { currentCourse, resetData, currentView, setCurrentView } = useAppContext();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-md dark:shadow-slate-700/50 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path><path d="M13 12.586 8.707 8.293a.999.999 0 1 0-1.414 1.414L10.586 13l-3.293 3.293a.999.999 0 1 0 1.414 1.414L12 14.414l3.293 3.293a.999.999 0 1 0 1.414-1.414L13.414 13l3.293-3.293a.999.999 0 1 0-1.414-1.414L13 11.586V6h-2v5.586z"></path>
                </svg>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">VocabBoost AI</h1>
            </div>
            {currentCourse && (
              <nav className="hidden md:flex items-center space-x-4">
                  <button onClick={() => setCurrentView(View.COURSE)} className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === View.COURSE ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}>
                      Course
                  </button>
                   <button onClick={() => setCurrentView(View.PRACTICE)} className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === View.PRACTICE ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}>
                      Practice
                  </button>
              </nav>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Site Language: {SITE_LANGUAGE.name}</span>
            {currentCourse && (
              <button 
                onClick={() => window.confirm('Are you sure you want to reset all your data?') && resetData()}
                className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
              >
                Reset Course
              </button>
            )}
            <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Toggle theme">
              {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;