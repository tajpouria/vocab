import React from 'react';

interface CompletionViewProps {
  title: string;
  message: string;
  buttonText?: string;
  onContinue?: () => void;
  successCount?: number;
  totalCount?: number;
}

const CompletionView: React.FC<CompletionViewProps> = ({
  title,
  message,
  buttonText,
  onContinue,
  successCount,
  totalCount
}) => {
  return (
    <div className="max-w-2xl mx-auto text-center p-4">
      <div className="bg-card p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-card-foreground">{title}</h2>
        <p className="mt-2 text-muted-foreground">{message}</p>
        {successCount !== undefined && totalCount !== undefined && (
          <p className="mt-2 text-muted-foreground">
            You got {successCount} out of {totalCount} exercises correct.
          </p>
        )}
        {buttonText && onContinue && (
          <button
            onClick={onContinue}
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default CompletionView;
