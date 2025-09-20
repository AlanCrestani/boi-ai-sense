import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoadingStateProps {
  type?: 'metrics' | 'charts' | 'filters';
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'charts',
  count = 1
}) => {
  if (type === 'metrics') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-4 w-24 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-16 rounded mb-2"></div>
              <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-3 w-20 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'filters') {
    return (
      <div className="flex items-center gap-4 mb-8 p-4 bg-card-secondary/30 rounded-lg border border-border-subtle">
        <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-4 w-32 rounded"></div>
        <div className="flex items-center gap-2">
          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-10 w-32 rounded"></div>
          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-4 w-8 rounded"></div>
          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-10 w-32 rounded"></div>
          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-10 w-24 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {[...Array(count)].map((_, index) => (
        <Card key={index} className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-6 w-48 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-48 w-full rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};