import React from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn('animate-pulse bg-muted rounded', className)} />
);

// Card Loading Skeleton
export const CardSkeleton: React.FC = () => (
  <div className="border rounded-lg p-4 space-y-3">
    <Skeleton className="h-4 w-1/4" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-3/4" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

// Perfume Card Skeleton
export const PerfumeCardSkeleton: React.FC = () => (
  <div className="glass rounded-2xl overflow-hidden">
    <Skeleton className="aspect-[4/5] w-full" />
    <div className="p-6 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  </div>
);

// Review Skeleton
export const ReviewSkeleton: React.FC = () => (
  <div className="border rounded-lg p-4 space-y-3">
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-16" />
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-4 w-4 rounded-full" />
        ))}
      </div>
    </div>
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-16 w-full" />
  </div>
);

// Table Loading
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="space-y-2">
    {/* Header */}
    <div className="flex gap-4 p-2">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4 p-2">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-8 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// Animated Spinner
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={cn(sizeClasses[size], className)}
    >
      <Loader className="w-full h-full" />
    </motion.div>
  );
};

// Loading Overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  text = 'Carregando...'
}) => (
  <div className="relative">
    {children}
    {isLoading && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <div className="flex flex-col items-center gap-2">
          <Spinner />
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
      </motion.div>
    )}
  </div>
);

// Progressive Loading States
export const ProgressiveLoader: React.FC<{
  steps: string[];
  currentStep: number;
  isComplete?: boolean;
}> = ({ steps, currentStep, isComplete = false }) => (
  <div className="space-y-4">
    {steps.map((step, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex items-center gap-3"
      >
        <div className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center',
          index < currentStep ? 'bg-primary border-primary' :
          index === currentStep ? 'border-primary animate-pulse' :
          'border-muted'
        )}>
          {index < currentStep && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 bg-primary-foreground rounded-full"
            />
          )}
          {index === currentStep && !isComplete && (
            <Spinner size="sm" className="w-3 h-3" />
          )}
        </div>
        <span className={cn(
          'text-sm',
          index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {step}
        </span>
      </motion.div>
    ))}
  </div>
);

// Button Loading State
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText = 'Carregando...',
  children,
  disabled,
  className,
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || isLoading}
    className={cn(
      'inline-flex items-center justify-center gap-2 transition-all',
      className
    )}
  >
    {isLoading && <Spinner size="sm" />}
    {isLoading ? loadingText : children}
  </button>
);

// Pulse Animation for Loading Elements
export const PulseLoader: React.FC<{ count?: number; className?: string }> = ({ 
  count = 3, 
  className 
}) => (
  <div className={cn('flex items-center gap-1', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          delay: i * 0.2,
        }}
        className="w-2 h-2 bg-primary rounded-full"
      />
    ))}
  </div>
);