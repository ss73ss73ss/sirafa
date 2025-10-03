import { useState, useEffect } from 'react';

interface OrientationModeState {
  isPortrait: boolean;
  isLandscape: boolean;
  isMobile: boolean;
  isAndroidAppMode: boolean;
  screenWidth: number;
  screenHeight: number;
}

export function useOrientationMode(): OrientationModeState {
  const [state, setState] = useState<OrientationModeState>(() => {
    // Initial state calculation
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Check if device has touch capability (mobile/tablet)
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    const isSmallScreen = screenWidth < 1024;
    const isMobile = isTouchDevice || isSmallScreen;
    
    // Android App Mode: Portrait + Mobile only
    const isAndroidAppMode = isPortrait && isMobile;
    
    return {
      isPortrait,
      isLandscape,
      isMobile,
      isAndroidAppMode,
      screenWidth,
      screenHeight,
    };
  });

  useEffect(() => {
    const updateOrientation = () => {
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
      const isSmallScreen = screenWidth < 1024;
      const isMobile = isTouchDevice || isSmallScreen;
      
      const isAndroidAppMode = isPortrait && isMobile;
      
      setState({
        isPortrait,
        isLandscape,
        isMobile,
        isAndroidAppMode,
        screenWidth,
        screenHeight,
      });

      // Add/remove android-app class to html element
      const htmlElement = document.documentElement;
      if (isAndroidAppMode) {
        htmlElement.classList.add('android-app');
      } else {
        htmlElement.classList.remove('android-app');
      }
    };

    // Create media queries
    const portraitQuery = window.matchMedia('(orientation: portrait)');
    const landscapeQuery = window.matchMedia('(orientation: landscape)');
    const touchQuery = window.matchMedia('(pointer: coarse)');

    // Add listeners
    portraitQuery.addEventListener('change', updateOrientation);
    landscapeQuery.addEventListener('change', updateOrientation);
    touchQuery.addEventListener('change', updateOrientation);
    
    // Also listen to resize and orientationchange for better compatibility
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    // Set initial state
    updateOrientation();

    // Cleanup
    return () => {
      portraitQuery.removeEventListener('change', updateOrientation);
      landscapeQuery.removeEventListener('change', updateOrientation);
      touchQuery.removeEventListener('change', updateOrientation);
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return state;
}