import React from "react";
import { useAppContext } from "../contexts/AppContext";
import { useTheme } from "../contexts/ThemeContext";
import SunIcon from "./icons/SunIcon";
import MoonIcon from "./icons/MoonIcon";
import ArrowLeftIcon from "./icons/ArrowLeftIcon";

const Header: React.FC = () => {
  const {
    userEmail,
    logout,
    activeStudySet,
    setActiveStudySetId,
    isInLearningMode,
  } = useAppContext();
  const { theme, toggleTheme } = useTheme();

  // Hide header when in learning mode
  if (isInLearningMode) {
    return null;
  }

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {activeStudySet && (
              <button
                onClick={() => setActiveStudySetId(null)}
                className="sm:hidden p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Back to study sets"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
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
                  onClick={() => logout().catch(console.error)}
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
