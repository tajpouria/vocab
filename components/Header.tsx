import React from "react";
import { useAppContext } from "../contexts/AppContext";
import { View } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import SunIcon from "./icons/SunIcon";
import MoonIcon from "./icons/MoonIcon";

const Header: React.FC = () => {
  const { currentCourse, currentView, setCurrentView, userEmail, logout, activeStudySet, setActiveStudySetId } =
    useAppContext();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {activeStudySet && (
              <button
                onClick={() => setActiveStudySetId(null)}
                className="p-2 rounded-full hover:bg-secondary"
                aria-label="Back to study sets"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {currentCourse && (
              <nav className="hidden md:flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView(View.COURSE)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentView === View.COURSE
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  Course
                </button>
                <button
                  onClick={() => setCurrentView(View.REVIEW)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentView === View.REVIEW
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  Review
                </button>
              </nav>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              {userEmail && (
                <span className="text-sm font-medium text-muted-foreground hidden sm:block truncate max-w-xs">
                  {userEmail}
                </span>
              )}
              {userEmail && (
                <button
                  onClick={logout}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Log Out
                </button>
              )}
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-muted-foreground hover:bg-secondary"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <MoonIcon className="h-5 w-5" />
              ) : (
                <SunIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
