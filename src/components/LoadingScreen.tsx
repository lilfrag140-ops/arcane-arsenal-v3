import { Zap } from "lucide-react";

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center animate-pulse">
            <Zap className="w-8 h-8 text-black" />
          </div>
          <span className="text-2xl font-heading font-bold gradient-text">Donut Grocery</span>
        </div>
        <div className="w-8 h-1 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-4">Loading your shopping experience...</p>
      </div>
    </div>
  );
};