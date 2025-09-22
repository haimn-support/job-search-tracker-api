import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  className?: string;
  containerClassName?: string;
  blur?: boolean;
  threshold?: number;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  fallback,
  className,
  containerClassName,
  blur = true,
  threshold = 0.1,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [threshold]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  // Generate placeholder based on dimensions
  const generatePlaceholder = (width = 400, height = 300) => {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" dy=".3em">
          Loading...
        </text>
      </svg>
    `)}`;
  };

  const currentSrc = hasError && fallback ? fallback : src;
  const showPlaceholder = !isLoaded && !hasError;
  const placeholderSrc = placeholder || generatePlaceholder();

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', containerClassName)}
    >
      {/* Placeholder */}
      {showPlaceholder && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-100 flex items-center justify-center',
            blur && 'backdrop-blur-sm'
          )}
        >
          <img
            src={placeholderSrc}
            alt=""
            className={cn('w-full h-full object-cover', blur && 'blur-sm')}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading="lazy"
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && !fallback && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isInView && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}
    </div>
  );
};

// Progressive image loading with multiple sources
export const ProgressiveImage: React.FC<{
  lowQualitySrc: string;
  highQualitySrc: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}> = ({
  lowQualitySrc,
  highQualitySrc,
  alt,
  className,
  containerClassName,
}) => {
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', containerClassName)}
    >
      {/* Low quality image (always visible when in view) */}
      {isInView && (
        <img
          src={lowQualitySrc}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            highQualityLoaded ? 'opacity-0' : 'opacity-100',
            'blur-sm scale-110',
            className
          )}
          loading="lazy"
        />
      )}

      {/* High quality image */}
      {isInView && (
        <img
          src={highQualitySrc}
          alt={alt}
          onLoad={() => setHighQualityLoaded(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
            highQualityLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default LazyImage;