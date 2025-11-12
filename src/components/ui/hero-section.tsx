import { ArrowRight, Star, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import RotatingText from "@/components/ui/rotating-text";
import { FlowingWaves } from "@/components/ui/flowing-waves";
import { SparkleEffect } from "@/components/ui/gaming-effects";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Flowing waves background */}
      <FlowingWaves />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-background/40 to-primary/5"></div>

      <div className="container mx-auto px-4 relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-4xl mx-auto">
          {/* Discord Button - Sticky positioned */}
          <div className="mb-8">
            <div className="sticky top-5 z-50 flex justify-center md:justify-center">
              <a 
                href="https://discord.gg/donutgrocery" 
                target="_blank" 
                rel="noopener noreferrer"
                className="discord-sticky inline-flex items-center space-x-2 bg-primary/90 border border-primary/30 rounded-full px-6 py-3 neon-border backdrop-blur-md shadow-lg hover:bg-primary/95 hover:scale-105 transition-all duration-300 cursor-pointer group"
              >
                <Star className="w-5 h-5 text-white animate-pulse group-hover:animate-spin" />
                <span className="text-sm font-medium text-white hidden sm:inline">Join discord.gg/donutgrocery</span>
                <span className="text-sm font-medium text-white sm:hidden">Discord</span>
              </a>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6">
            <span className="glow-text gradient-text animate-glow-pulse">Donut Grocery</span>
          </h1>

          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold text-foreground/80">
              The #1 Cheapest DonutSMP Market
            </h2>
          </div>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed">
            Get instant{' '}
            <span className="inline-block ml-2">
              <RotatingText
                texts={['Money', 'Spawners', 'Elytra', 'Gears']}
                mainClassName="px-2 sm:px-2 md:px-3 bg-primary/20 text-foreground overflow-hidden py-0.5 sm:py-1 md:py-1 justify-center rounded-lg inline-flex" 
                staggerFrom="last"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                transition={{ type: "spring", damping: 20, stiffness: 200, duration: 0.75 }}
                rotationInterval={3000}
              />
            </span>
            <br />
            delivery with{' '}
            <span className="text-primary font-semibold">secure transactions</span> and{' '}
            <span className="text-primary font-semibold">24/7 support</span>.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center space-x-2 text-sm text-foreground/70 hover:scale-105 transition-transform duration-300">
              <Shield className="w-4 h-4 text-primary animate-pulse-glow" />
              <span>Secure & Safe</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-foreground/70 hover:scale-105 transition-transform duration-300">
              <Zap className="w-4 h-4 text-primary animate-sparkle" />
              <span>Instant Delivery</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-foreground/70 hover:scale-105 transition-transform duration-300">
              <Star className="w-4 h-4 text-primary animate-rotate-slow" />
              <span>Best Prices</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SparkleEffect className="inline-block">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-secondary text-black font-semibold px-8 py-6 text-lg group transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/50"
                onClick={() => {
                  const featuredSection = document.getElementById('featured-products');
                  if (featuredSection) {
                    featuredSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Shop Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform animate-bounce-slow" />
              </Button>
            </SparkleEffect>
            <Link to="/about">
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-6 text-lg border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105"
              >
                Learn About Our Services
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
