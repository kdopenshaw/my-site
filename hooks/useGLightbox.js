// Minimal useGLightbox.js - safest approach
import { useEffect, useRef } from 'react';

export function useGLightbox() {
  const lightboxRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadGLightbox = async () => {
        const GLightbox = (await import('glightbox')).default;
        
        if (lightboxRef.current) {
          lightboxRef.current.destroy();
        }
        
        // Minimal configuration to avoid asset injection
        lightboxRef.current = GLightbox({
          selector: '.glightbox',
          loop: true,
          autoplayVideos: false, // Disable to avoid player conflicts
          // Minimal config - let GLightbox handle defaults
        });
      };
      
      loadGLightbox();
    }

    return () => {
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
      }
    };
  }, []);

  return lightboxRef.current;
}