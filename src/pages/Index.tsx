import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/ui/hero-section";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Star, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { MinecraftParallax } from "@/components/ui/minecraft-parallax";
import ClickSpark from "@/components/ui/click-spark";
import { LoadingScreen } from "@/components/LoadingScreen";
import { DecorativeWaves } from "@/components/ui/decorative-waves";
import { FloatingWaves } from "@/components/ui/floating-waves";
import { ProductSorter } from "@/components/ui/product-sorter";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";
// Use the correct image URLs as specified
const package1 = "https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/lgihtgrayshulekrbox.png";
const package2 = "https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/150px-White_Shulker_Box_JE2_BE2.png";
const package3 = "https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/Red_Shulker_Box.webp";
const package4 = "https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/Black_Shulker_Box.webp";
import { FloatingParticles, GlowOrbs, AnimatedGrid } from "@/components/ui/gaming-effects";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  stock_quantity: number;
  is_featured: boolean;
}

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [specialProducts, setSpecialProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    fetchFeaturedProducts();
    fetchSpecialProducts();
    
    return () => subscription.unsubscribe();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('price', { ascending: true }) // Order by price to get currency first
        .limit(6);

      if (error) throw error;
      
      // Custom ordering: currency, spawner, then items
      const orderedProducts = (data || []).sort((a, b) => {
        const categoryOrder = { 'currency': 1, 'spawner': 2, 'item': 3 };
        return (categoryOrder[a.category as keyof typeof categoryOrder] || 4) - 
               (categoryOrder[b.category as keyof typeof categoryOrder] || 4);
      });
      
      setFeaturedProducts(orderedProducts);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load featured products.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialProducts = async () => {
    const specialPackages = [
      {
        id: 'package-1',
        name: 'Package 1',
        description: '• 25 Skelly\n• 15M',
        price: 3,
        category: 'special',
        stock_quantity: 50,
        is_featured: false,
        image_url: package1
      },
      {
        id: 'package-2', 
        name: 'Package 2',
        description: '• 75 Skelly',
        price: 7,
        category: 'special',
        stock_quantity: 50,
        is_featured: false,
        image_url: package2
      },
      {
        id: 'package-3',
        name: 'Package 3', 
        description: '• 1x Elytra\n• 50 Skelly',
        price: 30,
        category: 'special',
        stock_quantity: 25,
        is_featured: false,
        image_url: package3
      },
      {
        id: 'package-4',
        name: 'Package 4',
        description: '• 75M',
        price: 8,
        category: 'special', 
        stock_quantity: 100,
        is_featured: false,
        image_url: package4
      }
    ];
    
    setSpecialProducts(specialPackages);
  };

  const handleAddToCart = async (productId: string, quantity: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to add items to cart",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: productId,
          quantity: quantity
        }, {
          onConflict: 'user_id,product_id'
        });

      if (error) throw error;

      toast({
        title: "Added to cart!",
        description: `${quantity} item(s) added to your shopping cart.`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ClickSpark
        sparkColor="hsl(var(--accent))"
        sparkSize={15}
        sparkRadius={25}
        sparkCount={12}
        duration={600}
      >
      <div className="min-h-screen bg-background relative">
        <FloatingParticles />
        <GlowOrbs />
        <AnimatedGrid />
        <DecorativeWaves />
        <FloatingWaves />
        <MinecraftParallax />
        <Header />
        
        {/* Hero Section */}
        <HeroSection />

      {/* Product Sections Container */}
      <section id="featured-products" className="py-20 px-4">
        <div className="container mx-auto">
          {/* Featured Products Section */}
          <div className="mb-20">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                <span className="gradient-text glow-text">Featured Items</span>
              </h2>
              <p className="text-xl text-foreground/70 max-w-2xl mx-auto mb-8">
                Get the best deals on essential DonutSMP items.
              </p>
            </div>

            {/* Product Sorter */}
            <ProductSorter 
              featuredProducts={featuredProducts}
              specialProducts={specialProducts}
              loading={loading}
              onAddToCart={handleAddToCart}
            />
          </div>

          {/* Legacy sections are now handled by ProductSorter - keeping for reference */}
          <div className="hidden">
            {/* Products Grid - Custom Layout */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted/20 rounded-lg h-80"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* First row: Money, Skeleton Spawner, Elytra */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredProducts
                    .filter(product => 
                      product.name.toLowerCase().includes('money') ||
                      product.name.toLowerCase().includes('skeleton spawner') ||
                      product.name.toLowerCase().includes('elytra')
                    )
                    .sort((a, b) => {
                      const order = ['money', 'skeleton spawner', 'elytra'];
                      const aIndex = order.findIndex(item => a.name.toLowerCase().includes(item));
                      const bIndex = order.findIndex(item => b.name.toLowerCase().includes(item));
                      return aIndex - bIndex;
                    })
                    .map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                </div>
                
                {/* Second row: Diamond and Netherite Armor Sets - Expanded Width */}
                <div className="flex justify-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                    {featuredProducts
                      .filter(product => 
                        product.name.toLowerCase().includes('diamond armor') ||
                        product.name.toLowerCase().includes('netherite armor')
                      )
                      .sort((a, b) => {
                        // Diamond first, then Netherite
                        if (a.name.toLowerCase().includes('diamond')) return -1;
                        if (b.name.toLowerCase().includes('diamond')) return 1;
                        return 0;
                      })
                      .map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Spacer between sections */}
          <div className="my-20"></div>

          {/* Legacy Specials Section - keeping hidden as it's now in ProductSorter */}
          <div className="hidden">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mb-6">
                <TrendingUp className="w-4 h-4 text-accent animate-glow-pulse" />
                <span className="text-sm font-medium">Special Offers</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                <span className="gradient-text glow-text">Special Deals</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Limited time offers and exclusive bundles.
              </p>
            </div>

            {/* Specials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {specialProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm py-12 neon-border">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center animate-pulse-glow">
                <Zap className="w-5 h-5 text-black animate-sparkle" />
              </div>
              <span className="text-xl font-heading font-bold glow-text gradient-text animate-glow-pulse">Donut Grocery</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Join discord.gg/donutgrocery for more info.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2024 Donut Grocery. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
        </div>
      </ClickSpark>
      <ChatbotWidget />
    </>
  );
};

export default Index;
