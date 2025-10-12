import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
  quality?: 'low' | 'medium' | 'high';
  priority?: boolean;
}

/**
 * OptimizedImage Component
 * 
 * Features:
 * - Automatic WebP conversion for supported browsers
 * - Lazy loading with IntersectionObserver
 * - Placeholder blur effect
 * - Quality presets for different use cases
 * - Fallback to original format
 */
export const OptimizedImage = ({
  src,
  alt,
  className,
  lazy = true,
  quality = 'medium',
  priority = false,
  ...props
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);

  // Convert quality to numeric value
  const qualityValue = {
    low: 60,
    medium: 80,
    high: 95
  }[quality];

  useEffect(() => {
    if (!lazy || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    const img = document.querySelector(`[data-src="${src}"]`);
    if (img) {
      observer.observe(img);
    }

    return () => observer.disconnect();
  }, [src, lazy, priority]);

  useEffect(() => {
    if (!isInView) return;

    // Check if browser supports WebP
    const supportsWebP = () => {
      const elem = document.createElement('canvas');
      if (elem.getContext && elem.getContext('2d')) {
        return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      return false;
    };

    // Convert image URL to WebP if supported and not already WebP
    const getOptimizedSrc = () => {
      if (!src) return '';
      
      // If it's an Unsplash URL, add quality param
      if (src.includes('unsplash.com')) {
        const url = new URL(src);
        url.searchParams.set('q', qualityValue.toString());
        if (supportsWebP()) {
          url.searchParams.set('fm', 'webp');
        }
        return url.toString();
      }

      // For Supabase or other URLs, use as-is (WebP conversion would be server-side)
      return src;
    };

    setImageSrc(getOptimizedSrc());
  }, [isInView, src, qualityValue]);

  if (!isInView) {
    return (
      <div
        data-src={src}
        className={cn(
          'bg-gray-200 animate-pulse',
          className
        )}
        aria-label={`Loading ${alt}`}
      />
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      onLoad={() => setIsLoaded(true)}
      {...props}
    />
  );
};
