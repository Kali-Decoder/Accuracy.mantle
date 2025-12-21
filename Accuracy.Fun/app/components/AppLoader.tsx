"use client";

import { useEffect, useState } from "react";

export function AppLoader() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Hide loader after reaching 100%
          setTimeout(() => {
            setIsVisible(false);
          }, 500);
          return 100;
        }
        // Increment by random amount between 1-5 for smooth progress
        const increment = Math.random() * 4 + 1;
        return Math.min(100, prev + increment);
      });
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-8">
        {/* Dynamic Text */}
        <div className="text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-tight">
            {progress < 50 ? "Accuracy.Fun" : "On Mantle"}
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="w-80 md:w-96">
          <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-white transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Percentage Display */}
          <div className="mt-4 text-center">
            <span className="text-4xl md:text-5xl font-mono font-bold text-white">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Loading dots animation */}
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

