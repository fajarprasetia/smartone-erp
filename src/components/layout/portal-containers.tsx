"use client"

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";

export function PortalContainers() {
  const [viewportHeight, setViewportHeight] = useState("100vh");

  useEffect(() => {
    // Function to update viewport height
    const updateViewportHeight = () => {
      // Get the actual viewport height
      const vh = window.innerHeight;
      // Set a CSS variable for the actual viewport height
      document.documentElement.style.setProperty('--actual-vh', `${vh}px`);
      setViewportHeight(`${vh}px`);
    };

    // Initial update
    updateViewportHeight();

    // Add event listener for resize
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return (
    <>
      <Toaster />
      {/* Dialog/Modal Portal - Highest z-index */}
      <div 
        id="dialog-portal" 
        style={{ 
          position: 'fixed', 
          zIndex: 1000,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          height: 'var(--actual-vh, 100vh)'
        }} 
      />
      
      {/* Popover Portal - Slightly lower than dialog */}
      <div 
        id="popover-portal" 
        style={{ 
          position: 'fixed', 
          zIndex: 999,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          height: 'var(--actual-vh, 100vh)'
        }} 
      />
      
      {/* Toast Portal - Below popovers */}
      <div 
        id="toast-portal" 
        style={{ 
          position: 'fixed', 
          zIndex: 998,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          height: 'var(--actual-vh, 100vh)'
        }} 
      />
    </>
  );
} 