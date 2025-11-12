import { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { id: string; name: string; price: number; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      
      if (existingItemIndex > -1) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += action.payload.quantity;
        return calculateCartState(updatedItems);
      } else {
        const newItems = [...state.items, action.payload];
        return calculateCartState(newItems);
      }
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      return calculateCartState(newItems);
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0);
      return calculateCartState(updatedItems);
    }
    
    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };
    
    case 'LOAD_CART':
      return action.payload;
    
    default:
      return state;
  }
};

const calculateCartState = (items: CartItem[]): CartState => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, total, itemCount };
};

interface CartContextType {
  state: CartState;
  addItem: (id: string, name: string, price: number, quantity: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0, itemCount: 0 });
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Initialize auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const previousSession = session;
        setSession(session);

        if (event === 'SIGNED_IN' && session) {
          // User just logged in - merge local cart with database cart
          setTimeout(() => {
            mergeCartsOnLogin(session);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          // User logged out - clear cart completely
          dispatch({ type: 'CLEAR_CART' });
          localStorage.removeItem('donut-cart');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load cart data after session is determined
  useEffect(() => {
    if (!isInitialized) return;

    if (session) {
      // Load cart from database for logged-in users
      loadCartFromDatabase();
    } else {
      // Load cart from localStorage for guest users
      loadCartFromLocalStorage();
    }
  }, [session, isInitialized]);

  // Save cart changes
  useEffect(() => {
    if (!isInitialized) return;

    if (session) {
      // Save to database for logged-in users
      saveCartToDatabase();
    } else {
      // Save to localStorage for guest users
      saveCartToLocalStorage();
    }
  }, [state, session, isInitialized]);

  const loadCartFromLocalStorage = () => {
    const savedCart = localStorage.getItem('donut-cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartData });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  };

  const saveCartToLocalStorage = () => {
    localStorage.setItem('donut-cart', JSON.stringify(state));
  };

  const loadCartFromDatabase = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;

      if (data) {
        const cartItems: CartItem[] = data.map(item => ({
          id: item.product_id,
          name: '', // Will be populated when needed
          price: 0, // Will be populated when needed
          quantity: item.quantity
        }));

        // Get product details for cart items
        if (cartItems.length > 0) {
          const productIds = cartItems.map(item => item.id);
          const { data: products, error: productError } = await supabase
            .from('products')
            .select('id, name, price')
            .in('id', productIds);

          if (!productError && products) {
            const enrichedItems = cartItems.map(cartItem => {
              const product = products.find(p => p.id === cartItem.id);
              return {
                ...cartItem,
                name: product?.name || '',
                price: product?.price || 0
              };
            }).filter(item => item.name); // Remove items where product wasn't found

            dispatch({ type: 'LOAD_CART', payload: calculateCartState(enrichedItems) });
          }
        }
      }
    } catch (error) {
      console.error('Error loading cart from database:', error);
    }
  };

  const saveCartToDatabase = async () => {
    if (!session || state.items.length === 0) return;

    try {
      // Clear existing cart items
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session.user.id);

      // Insert current cart items
      const cartItemsToSave = state.items.map(item => ({
        user_id: session.user.id,
        product_id: item.id,
        quantity: item.quantity
      }));

      const { error } = await supabase
        .from('cart_items')
        .insert(cartItemsToSave);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving cart to database:', error);
    }
  };

  const mergeCartsOnLogin = async (userSession: Session) => {
    try {
      // Get local cart
      const localCartData = localStorage.getItem('donut-cart');
      const localCart = localCartData ? JSON.parse(localCartData) : { items: [] };

      // Get database cart
      const { data: dbCartItems, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userSession.user.id);

      if (error) throw error;

      // Convert database items to cart format
      let dbCart: CartItem[] = [];
      if (dbCartItems && dbCartItems.length > 0) {
        const productIds = dbCartItems.map(item => item.product_id);
        const { data: products } = await supabase
          .from('products')
          .select('id, name, price')
          .in('id', productIds);

        if (products) {
          dbCart = dbCartItems.map(item => {
            const product = products.find(p => p.id === item.product_id);
            return {
              id: item.product_id,
              name: product?.name || '',
              price: product?.price || 0,
              quantity: item.quantity
            };
          }).filter(item => item.name);
        }
      }

      // Merge carts (local cart takes precedence for quantities)
      const mergedItems: CartItem[] = [...localCart.items];
      
      dbCart.forEach(dbItem => {
        const existingIndex = mergedItems.findIndex(item => item.id === dbItem.id);
        if (existingIndex > -1) {
          // Add quantities together
          mergedItems[existingIndex].quantity += dbItem.quantity;
        } else {
          // Add new item from database
          mergedItems.push(dbItem);
        }
      });

      // Update state with merged cart
      dispatch({ type: 'LOAD_CART', payload: calculateCartState(mergedItems) });
      
      // Clear local storage
      localStorage.removeItem('donut-cart');

      if (localCart.items.length > 0) {
        toast({
          title: "Cart merged",
          description: "Your local cart has been merged with your account.",
        });
      }
    } catch (error) {
      console.error('Error merging carts:', error);
    }
  };

  const addItem = (id: string, name: string, price: number, quantity: number) => {
    dispatch({ type: 'ADD_ITEM', payload: { id, name, price, quantity } });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    if (session) {
      // Also clear from database
      supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session.user.id)
        .then();
    } else {
      // Clear from localStorage
      localStorage.removeItem('donut-cart');
    }
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};