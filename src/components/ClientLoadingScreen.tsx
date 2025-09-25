"use client";

import { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

export default function ClientLoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Show loading for 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Show content by restoring opacity
      document.documentElement.style.opacity = '1';
      document.body.classList.add('loaded');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Don't render on server side
  if (!isMounted) {
    return null;
  }

  return <LoadingScreen isVisible={isVisible} />;
}
