import { useState } from "react";
import { ShoppingCart, Star, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import StarBorder from "@/components/ui/star-border";
import { Link } from "react-router-dom";
// Image URLs for different product types
const gameCurrency = "https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/money_9063314.png";
const skeletonSpawner = "https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/skelly.png";
const elytraGif = "/assets/elytra-03xwt-VA.gif";
const diamondArmorStatic = "https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/diamond_chestplate.png";
const netheriteArmorStatic = "https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/netherite_chestplate.png";
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image_url?: string;
    stock_quantity: number;
    is_featured: boolean;
  };
  onAddToCart?: (productId: string, quantity: number) => void;
}
export const ProductCard = ({
  product,
  onAddToCart
}: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const {
    addItem
  } = useCart();
  const {
    toast
  } = useToast();
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'currency':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'spawner':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'item':
        return 'bg-secondary/20 text-secondary border-secondary/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };
  const getProductImage = (productName: string, category: string) => {
    // Check for custom image_url first (only if it's a valid non-empty string)
    if (product.image_url && product.image_url.trim() !== '') {
      return <img src={product.image_url} alt={productName} className="w-12 h-12 object-contain" loading="lazy" />;
    }
    
    const name = productName.toLowerCase();
    if (name.includes('money') || category === 'currency') {
      return <img src={gameCurrency} alt="Money" className="w-12 h-12 object-contain" loading="lazy" />;
    } else if (name.includes('skeleton spawner')) {
      return <img src={skeletonSpawner} alt="Skeleton Spawner" className="w-12 h-12 object-contain" loading="lazy" />;
    } else if (name.includes('elytra')) {
      return <img src={elytraGif} alt="Elytra" className="w-12 h-12 object-contain" loading="lazy" />;
    } else if (name.includes('diamond armor')) {
      return <img src={diamondArmorStatic} alt="Diamond Armor Set" className="w-12 h-12 object-contain" loading="lazy" />;
    } else if (name.includes('netherite armor')) {
      return <img src={netheriteArmorStatic} alt="Netherite Armor Set" className="w-12 h-12 object-contain" loading="lazy" />;
    } else {
      return <div className="text-3xl">⚡</div>;
    }
  };
  const getSmallProductImage = (productName: string, category: string) => {
    // Check for custom image_url first (only if it's a valid non-empty string)
    if (product.image_url && product.image_url.trim() !== '') {
      return <img src={product.image_url} alt="" className="w-4 h-4 object-contain" loading="lazy" />;
    }
    
    const name = productName.toLowerCase();
    if (name.includes('money') || category === 'currency') {
      return <img src={gameCurrency} alt="" className="w-4 h-4 object-contain" loading="lazy" />;
    } else if (name.includes('skeleton spawner')) {
      return <img src={skeletonSpawner} alt="" className="w-4 h-4 object-contain" loading="lazy" />;
    } else if (name.includes('elytra')) {
      return <img src={elytraGif} alt="" className="w-4 h-4 object-contain" loading="lazy" />;
    } else if (name.includes('diamond armor')) {
      return <img src={diamondArmorStatic} alt="" className="w-4 h-4 object-contain" loading="lazy" />;
    } else if (name.includes('netherite armor')) {
      return <img src={netheriteArmorStatic} alt="" className="w-4 h-4 object-contain" loading="lazy" />;
    } else {
      return '⚡';
    }
  };
  const handleQuantityChange = (newQuantity: number) => {
    const maxQuantity = Math.max(1, product.stock_quantity);

    // Allow setting to 0 temporarily for user input, but enforce minimum of 1
    if (isNaN(newQuantity) || newQuantity < 0) {
      return; // Don't update for invalid values
    }

    // If user tries to enter more than stock, cap it at stock quantity
    if (newQuantity > maxQuantity) {
      setQuantity(maxQuantity);
      toast({
        title: "Stock Limit Reached",
        description: `Only ${maxQuantity} items available in stock`,
        variant: "destructive"
      });
      return;
    }

    // Allow 0 for input purposes, but will be corrected on blur
    if (newQuantity === 0) {
      setQuantity(0);
      return;
    }
    setQuantity(newQuantity);
  };
  const handleQuantityBlur = () => {
    // If quantity is 0 or less, reset to 1
    if (quantity <= 0) {
      setQuantity(1);
    }
  };
  const totalPrice = (product.price * quantity).toFixed(2);
  const handleAddToCart = () => {
    if (product.stock_quantity <= 0) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock",
        variant: "destructive"
      });
      return;
    }
    addItem(product.id, product.name, product.price, quantity);
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} added to your cart`
    });
    setQuantity(1); // Reset quantity after adding
    onAddToCart?.(product.id, quantity);
  };
  const isOutOfStock = product.stock_quantity <= 0;
  return <div className="group relative">
      <div className={`bg-card/90 backdrop-blur-sm border-2 border-primary/30 rounded-2xl p-6 text-center transition-all duration-300 hover:border-primary hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] hover:scale-105 ${isOutOfStock ? '[&>*:not(.out-of-stock-img)]:grayscale opacity-60' : ''}`}>
        {/* Out of Stock Indicator */}
        {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center z-10 out-of-stock-img">
            <img src="https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/outofstock.png" alt="Out of Stock" className="w-64 h-64 animate-pulse object-contain" />
          </div>}
        
        {/* Stock Count */}
        <div className="absolute top-2 right-2 bg-primary/20 text-foreground text-xs px-2 py-1 rounded-full border border-primary/30">
          {product.stock_quantity} in stock
        </div>
        
        {/* Product Image */}
        <div className="mb-4 flex justify-center">
          {getProductImage(product.name, product.category)}
        </div>
        
        {/* Product Name */}
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="text-lg font-semibold text-foreground mb-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {/* Product Description */}
        <p className="text-sm text-muted-foreground mb-3 whitespace-pre-line">
          {product.description}
        </p>
        
        {/* Product Description for Armor Sets */}
        {product.name.toLowerCase().includes('diamond armor') && <p className="text-xs text-muted-foreground mb-3">
            Includes: Helmet, Chestplate, Leggings & Boots (all maxed)
          </p>}
        {product.name.toLowerCase().includes('netherite armor') && <p className="text-xs text-muted-foreground mb-3">
            Includes: Helmet, Chestplate, Leggings & Boots (all maxed)
          </p>}
        {!product.name.toLowerCase().includes('armor') && <div className="mb-2"></div>}
        
        {/* Quantity Input */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <Input 
            type="number" 
            value={quantity} 
            onChange={e => {
              const value = e.target.value;
              // Allow empty string for deletion
              if (value === '') {
                setQuantity(0);
                return;
              }
              handleQuantityChange(parseInt(value));
            }} 
            onBlur={handleQuantityBlur} 
            className="w-16 text-center bg-background/50 border-primary/20 text-foreground" 
            min="0" 
            max={Math.max(1, product.stock_quantity)} 
            disabled={isOutOfStock}
            aria-label={`Quantity for ${product.name}`}
          />
          {(product.name.toLowerCase().includes('money') || product.category === 'currency') && <span className="text-sm font-medium text-primary">M</span>}
        </div>
        
        {/* Price */}
        <div className="text-2xl font-bold text-primary mb-4">
          ${totalPrice}
        </div>
        
        {/* Add to Cart Button */}
        <Button onClick={handleAddToCart} disabled={isOutOfStock} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </div>;
};