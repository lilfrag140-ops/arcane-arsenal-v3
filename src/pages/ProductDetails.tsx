import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, Package, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { Badge } from '@/components/ui/badge';

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

export const ProductDetails = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Product not found",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

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
          product_id: product.id,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="bg-muted/20 rounded-lg h-8 w-32"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-muted/20 rounded-lg h-96"></div>
              <div className="space-y-4">
                <div className="bg-muted/20 rounded h-8 w-3/4"></div>
                <div className="bg-muted/20 rounded h-6 w-1/2"></div>
                <div className="bg-muted/20 rounded h-24 w-full"></div>
                <div className="bg-muted/20 rounded h-12 w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Button>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="flex justify-center items-center bg-card/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-8">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name}
                className="max-w-full max-h-96 object-contain"
              />
            ) : (
              <div className="w-64 h-64 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-24 h-24 text-primary/50" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{product.name}</h1>
                {product.is_featured && (
                  <Badge className="bg-primary/20 text-foreground border-primary/30">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary">
                {product.category}
              </Badge>
            </div>

            <div className="text-3xl font-bold text-primary">
              ${product.price}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-foreground/80 leading-relaxed">
                {product.description || 'No description available.'}
              </p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <Badge 
                variant={isOutOfStock ? "destructive" : "outline"}
                className={isOutOfStock ? "" : "border-green-500 text-green-600"}
              >
                {isOutOfStock ? 'Out of Stock' : `${product.stock_quantity} in stock`}
              </Badge>
            </div>

            {/* Add to Cart */}
            {!isOutOfStock && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label htmlFor="quantity" className="font-medium">
                    Quantity:
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    max={product.stock_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-2 border border-primary/20 rounded-lg bg-background/50 text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <Button 
                  onClick={handleAddToCart}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 text-lg"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart - ${(product.price * quantity).toFixed(2)}
                </Button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetails;