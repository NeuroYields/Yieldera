import { useState, useRef, useEffect } from 'react';

interface LazyAnimatedSVGProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackText?: string;
}

const LazyAnimatedSVG = ({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  fallbackText = 'Loading architecture diagram...'
}: LazyAnimatedSVGProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-4xl mx-auto ${className}`}
      style={{
        aspectRatio: `${width}/${height}`,
        minHeight: `${height * 0.5}px`
      }}
    >
      {/* Placeholder/Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/20 rounded-lg border border-border/30 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground font-mono text-sm">{fallbackText}</p>
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/20 rounded-lg border border-border/30 backdrop-blur-sm">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-muted/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-terminal text-sm text-glow-green mb-2">ARCHITECTURE DIAGRAM</h3>
            <p className="text-muted-foreground font-mono text-xs">
              Interactive flowchart showing how Yieldera's AI-powered liquidity management works
            </p>
          </div>
        </div>
      )}

      {/* Lazy-loaded SVG */}
      {isInView && !hasError && (
        <object
          data={src}
          type="image/svg+xml"
          width="100%"
          height="100%"
          className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleLoad}
          onError={handleError}
          aria-label={alt}
          role="img"
        >
          <img
            src={src}
            alt={alt}
            width="100%"
            height="100%"
            onLoad={handleLoad}
            onError={handleError}
            className="w-full h-full object-contain"
          />
        </object>
      )}
    </div>
  );
};

export default LazyAnimatedSVG;