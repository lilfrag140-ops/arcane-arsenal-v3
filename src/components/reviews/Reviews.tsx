import { useState, useEffect } from 'react';
import { ReviewForm } from './ReviewForm';
import { ReviewsList } from './ReviewsList';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface ReviewsProps {
  productId: string;
}

export const Reviews = ({ productId }: ReviewsProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkReviewEligibility(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session) {
          checkReviewEligibility(session.user.id);
        } else {
          setCanReview(false);
          setHasReviewed(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [productId]);

  const checkReviewEligibility = async (userId: string) => {
    try {
      setLoading(true);
      
      // Check if user has purchased this product
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          order_items!inner(product_id)
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .eq('order_items.product_id', productId);

      if (orderError) throw orderError;

      const hasPurchased = orders && orders.length > 0;
      setCanReview(hasPurchased);

      if (hasPurchased) {
        // Check if user has already reviewed this product
        const { data: existingReview, error: reviewError } = await supabase
          .from('reviews')
          .select('id')
          .eq('user_id', userId)
          .eq('product_id', productId)
          .maybeSingle();

        if (reviewError) throw reviewError;
        
        setHasReviewed(!!existingReview);
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      setCanReview(false);
      setHasReviewed(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    setHasReviewed(true);
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="bg-muted/20 rounded-lg h-32"></div>
        <div className="bg-muted/20 rounded-lg h-24"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Form - Only show if user is eligible and hasn't reviewed yet */}
      {session && canReview && !hasReviewed && (
        <ReviewForm 
          productId={productId} 
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Messages for different states */}
      {session && !canReview && (
        <div className="bg-muted/20 border border-muted/30 rounded-lg p-4 text-center">
          <p className="text-muted-foreground">
            You can only review products you have purchased and received.
          </p>
        </div>
      )}

      {session && hasReviewed && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
          <p className="text-primary">
            Thank you for your review! You have already reviewed this product.
          </p>
        </div>
      )}

      {!session && (
        <div className="bg-muted/20 border border-muted/30 rounded-lg p-4 text-center">
          <p className="text-muted-foreground">
            Please sign in to leave a review.
          </p>
        </div>
      )}

      {/* Reviews List */}
      <ReviewsList 
        productId={productId} 
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};