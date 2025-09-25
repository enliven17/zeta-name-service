"use client";

import { useEffect } from 'react';

export function ClientLoadingManager() {
  useEffect(() => {
    // Add loaded class to body when component mounts
    document.body.classList.add('loaded');
    
    // Remove any existing loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }, []);

  return null;
}