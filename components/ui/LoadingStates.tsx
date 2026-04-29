'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner = ({ size = 'md', text }: LoadingSpinnerProps): React.ReactElement => {
  const sizeMap = { sm: 16, md: 24, lg: 40 };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
      <Loader2 size={sizeMap[size]} className="animate-spin text-blue-400" />
      {text && <p className="text-sm">{text}</p>}
    </div>
  );
};

export const PageLoader = (): React.ReactElement => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <LoadingSpinner size="lg" text="Loading DIRECTRONICS..." />
  </div>
);

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState = ({ title, description, action, icon }: EmptyStateProps): React.ReactElement => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="mb-4 text-slate-600">{icon}</div>}
    <h3 className="text-lg font-semibold text-slate-300">{title}</h3>
    {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps): React.ReactElement => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
      <span className="text-red-400 text-xl">!</span>
    </div>
    <p className="text-red-400 font-medium">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary btn-sm mt-4">
        Try Again
      </button>
    )}
  </div>
);
