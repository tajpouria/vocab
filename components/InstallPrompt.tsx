import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
      }
    };

    checkIfInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      
      // Check if user has permanently dismissed the prompt
      const permanentlyDismissed = localStorage.getItem('installPromptPermanentlyDismissed');
      if (permanentlyDismissed === 'true') {
        return; // Don't show the prompt at all
      }

      // Check for temporary dismissal (7 days)
      const dismissed = localStorage.getItem('installPromptDismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          return; // Don't show the prompt for 7 days
        }
      }

      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    } else if (outcome === 'dismissed') {
      // User explicitly dismissed the native prompt, remember this choice
      setShowInstallPrompt(false);
      localStorage.setItem('installPromptPermanentlyDismissed', 'true');
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = (permanent = false) => {
    setShowInstallPrompt(false);
    if (permanent) {
      // Store permanent dismissal
      localStorage.setItem('installPromptPermanentlyDismissed', 'true');
    } else {
      // Store temporary dismissal (7 days)
      localStorage.setItem('installPromptDismissed', Date.now().toString());
    }
  };



  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 max-w-sm mx-auto">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Install VocabBoost
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Install the app for quick access and offline learning
          </p>
        </div>
        <button
          onClick={() => handleDismiss(false)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-primary text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-primary/90 transition-colors"
          >
            Install
          </button>
          <button
            onClick={() => handleDismiss(false)}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-3 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Not now
          </button>
        </div>
        <button
          onClick={() => handleDismiss(true)}
          className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors underline"
        >
          Don't ask again
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
