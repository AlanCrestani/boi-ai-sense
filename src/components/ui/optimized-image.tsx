import React, { useState, useEffect } from 'react';
import { useLazyImage } from '@/hooks/useLazyImage';
import { getOptimizedImageSrc, preloadImage } from '@/utils/imageOptimization';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  priority?: 'high' | 'low';
  lazy?: boolean;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  sizes?: string;
  quality?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc,
  priority = 'low',
  lazy = true,
  placeholder,
  className,
  containerClassName,
  sizes,
  quality = 85,
  ...props
}) => {
  const [optimizedSrc, setOptimizedSrc] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const { ref, src: lazySrc, isLoaded, isInView } = useLazyImage(
    optimizedSrc || src,
    {
      placeholder,
      rootMargin: '50px',
      threshold: 0.1,
    }
  );

  useEffect(() => {
    const loadOptimizedSrc = async () => {
      try {
        const optimized = await getOptimizedImageSrc(src, {
          quality,
          format: 'webp',
          fallback: fallbackSrc || src,
        });
        setOptimizedSrc(optimized);

        // Preload if high priority
        if (priority === 'high') {
          preloadImage(optimized, priority);
        }
      } catch (err) {
        console.warn('Failed to optimize image:', err);
        setOptimizedSrc(src);
      }
    };

    loadOptimizedSrc();
  }, [src, quality, fallbackSrc, priority]);

  const handleError = () => {
    setError(true);
    if (fallbackSrc && fallbackSrc !== optimizedSrc) {
      setOptimizedSrc(fallbackSrc);
    }
  };

  const imageToShow = lazy ? lazySrc : optimizedSrc;
  const shouldShowPlaceholder = lazy && (!isInView || !isLoaded);

  if (lazy) {
    return (
      <div ref={ref} className={cn('relative overflow-hidden', containerClassName)}>
        {shouldShowPlaceholder && placeholder && (
          <div
            className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
            style={{ backgroundColor: '#f3f4f6' }}
          >
            <span className="text-gray-400 text-sm">Loading...</span>
          </div>
        )}

        {imageToShow && (
          <img
            {...props}
            src={imageToShow}
            alt={alt}
            sizes={sizes}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            onError={handleError}
            loading="lazy"
            decoding="async"
            fetchPriority={priority}
          />
        )}
      </div>
    );
  }

  return (
    <img
      {...props}
      src={imageToShow || src}
      alt={alt}
      sizes={sizes}
      className={cn(className)}
      onError={handleError}
      loading={priority === 'high' ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority}
    />
  );
};