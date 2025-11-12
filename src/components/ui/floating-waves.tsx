import React from 'react';

export const FloatingWaves = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large floating wave - top right */}
      <div className="absolute -top-32 -right-32 w-96 h-96 opacity-30">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full animate-pulse"
          style={{ animationDuration: '4s' }}
        >
          <defs>
            <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            d="M50,200 C100,150 150,250 200,200 C250,150 300,250 350,200 L350,350 L50,350 Z"
            fill="url(#wave-gradient-1)"
            className="animate-bounce"
            style={{ animationDuration: '3s' }}
          />
        </svg>
      </div>

      {/* Medium floating wave - middle left */}
      <div className="absolute top-1/2 -left-24 w-64 h-64 opacity-20">
        <svg
          viewBox="0 0 300 300"
          className="w-full h-full animate-pulse"
          style={{ animationDuration: '5s', animationDelay: '1s' }}
        >
          <defs>
            <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d="M30,150 C80,100 130,200 180,150 C230,100 280,200 300,150 L300,300 L30,300 Z"
            fill="url(#wave-gradient-2)"
          />
        </svg>
      </div>

      {/* Small floating wave - bottom center */}
      <div className="absolute -bottom-16 left-1/3 w-48 h-48 opacity-25">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full animate-pulse"
          style={{ animationDuration: '3.5s', animationDelay: '2s' }}
        >
          <defs>
            <linearGradient id="wave-gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            d="M20,100 C50,80 80,120 110,100 C140,80 170,120 180,100 L180,200 L20,200 Z"
            fill="url(#wave-gradient-3)"
          />
        </svg>
      </div>

      {/* Tiny accent wave - top left */}
      <div className="absolute top-20 left-20 w-32 h-32 opacity-40">
        <svg
          viewBox="0 0 150 150"
          className="w-full h-full animate-pulse"
          style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}
        >
          <defs>
            <linearGradient id="wave-gradient-4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <circle cx="75" cy="75" r="40" fill="url(#wave-gradient-4)" />
        </svg>
      </div>

      {/* Mobile responsive smaller elements */}
      <div className="md:hidden absolute top-1/4 right-4 w-20 h-20 opacity-30">
        <svg viewBox="0 0 100 100" className="w-full h-full animate-spin" style={{ animationDuration: '20s' }}>
          <circle cx="50" cy="50" r="20" fill="hsl(var(--primary))" fillOpacity="0.2" />
        </svg>
      </div>
    </div>
  );
};