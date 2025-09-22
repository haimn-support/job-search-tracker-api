import React, { useRef, useEffect, useState } from 'react';
import { useSwipeGestures } from '../../hooks/useSwipeGestures';
import { cn } from '../../utils/cn';

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: 'blue' | 'green' | 'red' | 'yellow';
  action: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  className?: string;
  disabled?: boolean;
}

const actionColors = {
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  red: 'bg-red-500 text-white',
  yellow: 'bg-yellow-500 text-white',
};

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftAction,
  rightAction,
  className,
  disabled = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipeLeft = () => {
    if (disabled || !rightAction) return;
    setSwipeDirection('left');
    setIsSwipeActive(true);
    setTimeout(() => {
      rightAction.action();
      resetSwipe();
    }, 200);
  };

  const handleSwipeRight = () => {
    if (disabled || !leftAction) return;
    setSwipeDirection('right');
    setIsSwipeActive(true);
    setTimeout(() => {
      leftAction.action();
      resetSwipe();
    }, 200);
  };

  const resetSwipe = () => {
    setIsSwipeActive(false);
    setSwipeDirection(null);
  };

  const { attachSwipeListeners } = useSwipeGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 80,
  });

  useEffect(() => {
    const element = cardRef.current;
    if (!element || disabled) return;

    const cleanup = attachSwipeListeners(element);
    return cleanup;
  }, [attachSwipeListeners, disabled]);

  // Only show swipe functionality on mobile devices
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (!isMobile || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Left action background */}
      {leftAction && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 flex items-center justify-start pl-4 transition-all duration-200',
            actionColors[leftAction.color],
            swipeDirection === 'right' && isSwipeActive
              ? 'w-full opacity-100'
              : 'w-0 opacity-0'
          )}
        >
          <div className="flex items-center space-x-2">
            {leftAction.icon}
            <span className="font-medium">{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Right action background */}
      {rightAction && (
        <div
          className={cn(
            'absolute inset-y-0 right-0 flex items-center justify-end pr-4 transition-all duration-200',
            actionColors[rightAction.color],
            swipeDirection === 'left' && isSwipeActive
              ? 'w-full opacity-100'
              : 'w-0 opacity-0'
          )}
        >
          <div className="flex items-center space-x-2">
            <span className="font-medium">{rightAction.label}</span>
            {rightAction.icon}
          </div>
        </div>
      )}

      {/* Card content */}
      <div
        ref={cardRef}
        className={cn(
          'relative z-10 transition-transform duration-200',
          isSwipeActive && swipeDirection === 'left' && 'transform -translate-x-full',
          isSwipeActive && swipeDirection === 'right' && 'transform translate-x-full'
        )}
      >
        {children}
      </div>

      {/* Swipe indicators */}
      {(leftAction || rightAction) && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-20">
          {leftAction && (
            <div className="w-1 h-1 bg-gray-300 rounded-full opacity-50" />
          )}
          {rightAction && (
            <div className="w-1 h-1 bg-gray-300 rounded-full opacity-50" />
          )}
        </div>
      )}
    </div>
  );
};

export default SwipeableCard;