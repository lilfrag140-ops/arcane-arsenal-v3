-- Create reviews table with proper constraints
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (char_length(comment) >= 5 AND char_length(comment) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one review per user per product
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only insert reviews for products they have purchased (completed orders)
CREATE POLICY "Users can insert reviews for purchased products"
ON public.reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 
    FROM orders o
    INNER JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = auth.uid()
      AND oi.product_id = reviews.product_id
      AND o.status = 'completed'
  )
);

-- Policy: Users can view their own reviews and update them
CREATE POLICY "Users can update their own reviews"
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own reviews for deletion
CREATE POLICY "Users can delete their own reviews"
ON public.reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policy: Anyone can read all reviews
CREATE POLICY "Anyone can read reviews"
ON public.reviews 
FOR SELECT 
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reviews_updated_at();

-- Create index for better performance
CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);