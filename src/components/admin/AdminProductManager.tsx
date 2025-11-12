import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminAudit } from "@/hooks/useAdminAudit";
import { Pencil, Plus, Save, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
  image_url: string | null;
}

export const AdminProductManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { logProductManagement } = useAdminAudit();

  const defaultProduct: Omit<Product, 'id'> = {
    name: "",
    description: "",
    price: 0,
    category: "item",
    stock_quantity: 0,
    is_featured: false,
    is_active: true,
    image_url: null,
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch products",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (product: Omit<Product, 'id'> | Product) => {
    try {
      if ('id' in product) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(product)
          .eq('id', product.id);

        if (error) throw error;
        
        // Log admin action
        await logProductManagement('update', product.id, {
          name: product.name,
          price: product.price,
          category: product.category
        });

        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert([product])
          .select();

        if (error) throw error;
        
        // Log admin action
        if (data && data[0]) {
          await logProductManagement('create', data[0].id, {
            name: product.name,
            price: product.price,
            category: product.category
          });
        }

        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      setEditingProduct(null);
      setIsCreating(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save product",
      });
    }
  };

  const handleStockUpdate = async (productId: string, newStock: number) => {
    try {
      const oldStock = products.find(p => p.id === productId)?.stock_quantity || 0;
      
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', productId);

      if (error) throw error;
      
      // Log admin action
      await logProductManagement('stock_update', productId, {
        old_stock: oldStock,
        new_stock: newStock
      });
      
      setProducts(products.map(p => 
        p.id === productId ? { ...p, stock_quantity: newStock } : p
      ));
      
      toast({
        title: "Success",
        description: "Stock updated successfully",
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update stock",
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading products...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <Button onClick={() => setIsCreating(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Create/Edit Product Form */}
      {(isCreating || editingProduct) && (
        <ProductForm
          product={editingProduct || defaultProduct}
          onSave={handleSave}
          onCancel={() => {
            setIsCreating(false);
            setEditingProduct(null);
          }}
          isCreating={isCreating}
        />
      )}

      {/* Products List */}
      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{product.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span>Price: ${product.price}</span>
                    <span>Category: {product.category}</span>
                    <span className={product.is_active ? "text-green-600" : "text-red-600"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                    {product.is_featured && <span className="text-primary">Featured</span>}
                  </div>
                </div>
                
                {/* Stock Management */}
                <div className="flex items-center gap-2">
                  <Label htmlFor={`stock-${product.id}`} className="text-sm">Stock:</Label>
                  <Input
                    id={`stock-${product.id}`}
                    type="number"
                    value={product.stock_quantity}
                    onChange={(e) => handleStockUpdate(product.id, parseInt(e.target.value) || 0)}
                    className="w-20"
                    min="0"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProduct(product)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface ProductFormProps {
  product: Omit<Product, 'id'> | Product;
  onSave: (product: Omit<Product, 'id'> | Product) => void;
  onCancel: () => void;
  isCreating: boolean;
}

const ProductForm = ({ product, onSave, onCancel, isCreating }: ProductFormProps) => {
  const [formData, setFormData] = useState(product);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isCreating ? "Create Product" : "Edit Product"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="spawner">Spawner</SelectItem>
                  <SelectItem value="item">Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              value={formData.image_url || ""}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
              <Label htmlFor="is_featured">Featured</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button type="submit" className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              {isCreating ? "Create" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};