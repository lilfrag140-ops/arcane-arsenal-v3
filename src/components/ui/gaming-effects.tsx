import { useEffect, useState } from "react";

// Floating particles component
export const FloatingParticles = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
};

// Gaming-style glow orbs
export const GlowOrbs = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div 
        className="absolute w-32 h-32 bg-primary/10 rounded-full blur-xl animate-float"
        style={{ 
          top: "20%", 
          left: "10%", 
          animationDelay: "0s",
          animationDuration: "6s" 
        }}
      />
      <div 
        className="absolute w-24 h-24 bg-secondary/10 rounded-full blur-xl animate-float"
        style={{ 
          top: "60%", 
          right: "15%", 
          animationDelay: "2s",
          animationDuration: "8s" 
        }}
      />
      <div 
        className="absolute w-20 h-20 bg-accent/10 rounded-full blur-xl animate-float"
        style={{ 
          bottom: "30%", 
          left: "70%", 
          animationDelay: "4s",
          animationDuration: "7s" 
        }}
      />
    </div>
  );
};

// Interactive sparkle effect for buttons
export const SparkleEffect = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const [sparkles, setSparkles] = useState<Array<{ id: number, x: number, y: number }>>([]);

  const createSparkle = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newSparkle = {
      id: Date.now() + Math.random(),
      x,
      y,
    };
    
    setSparkles(prev => [...prev, newSparkle]);
    
    // Remove sparkle after animation
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
    }, 1000);
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={createSparkle}
    >
      {children}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="absolute pointer-events-none"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-2 h-2 bg-primary rounded-full animate-sparkle" />
        </div>
      ))}
    </div>
  );
};

// Animated background grid
export const AnimatedGrid = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
      <div 
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'particles-float 30s linear infinite'
        }}
      />
    </div>
  );
};

// Gaming-style loading spinner
export const GamingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
      <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <div className="absolute inset-2 border border-secondary/40 rounded-full animate-pulse"></div>
    </div>
  );
};