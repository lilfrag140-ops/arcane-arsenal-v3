import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ui/product-card";

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

interface ProductSorterProps {
  featuredProducts: Product[];
  specialProducts: Product[];
  loading: boolean;
  onAddToCart: (productId: string, quantity: number) => void;
}

export const ProductSorter = ({ featuredProducts, specialProducts, loading, onAddToCart }: ProductSorterProps) => {
  const [activeTab, setActiveTab] = useState("categories");

  const getCategorizedProducts = () => {
    const money = featuredProducts.filter(p => p.name.toLowerCase().includes('money'));
    const elytra = featuredProducts.filter(p => p.name.toLowerCase().includes('elytra'));
    const armorSets = featuredProducts.filter(p => 
      p.name.toLowerCase().includes('diamond armor') || 
      p.name.toLowerCase().includes('netherite armor')
    );
    const spawners = featuredProducts.filter(p => p.name.toLowerCase().includes('spawner'));

    return { money, elytra, armorSets, spawners };
  };

  const { money, elytra, armorSets, spawners } = getCategorizedProducts();

  const renderCategorySection = (title: string, products: Product[], bgColor: string) => {
    if (products.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <div className={`inline-flex items-center space-x-2 ${bgColor} rounded-full px-4 py-2 mb-6`}>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className={`grid gap-6 ${
          products.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
          products.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <ProductCard 
                product={product} 
                onAddToCart={onAddToCart}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderSpecialDeals = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {specialProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <ProductCard 
              product={product} 
              onAddToCart={onAddToCart}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted/20 rounded-lg h-80"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="my-12">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="bg-card/50 backdrop-blur-sm border border-primary/20 p-1 rounded-full">
            <TabsTrigger 
              value="categories" 
              className="px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              Categories
            </TabsTrigger>
            <TabsTrigger 
              value="special-deals" 
              className="px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              Special Deals
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="categories" className="mt-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
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
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <ProductCard 
                        product={product} 
                        onAddToCart={onAddToCart}
                      />
                    </motion.div>
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
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <ProductCard 
                          product={product} 
                          onAddToCart={onAddToCart}
                        />
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="special-deals" className="mt-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {renderSpecialDeals()}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};