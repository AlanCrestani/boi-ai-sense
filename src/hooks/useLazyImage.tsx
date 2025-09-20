import { useState, useEffect, useRef } from 'react';

interface UseLazyImageOptions {
  rootMargin?: string;
  threshold?: number;
  placeholder?: string;
}

export function useLazyImage(
  src: string,
  options: UseLazyImageOptions = {}
) {
  const [imageSrc, setImageSrc] = useState<string | null>(options.placeholder || null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold]);

  useEffect(() => {
    if (isInView && !isLoaded) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        console.warn(`Failed to load image: ${src}`);
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [isInView, isLoaded, src]);

  return {
    ref: imgRef,
    src: imageSrc,
    isLoaded,
    isInView,
  };
}