import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted?: () => void;
}

export const ReviewForm = ({ productId, onReviewSubmitted }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "Rating is required to submit a review.",
        variant: "destructive",
      });
      return;
    }
    
    if (comment.length < 5) {
      toast({
        title: "Comment too short",
        description: "Please write at least 5 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You must be signed in to leave a review.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          comment: comment.trim()
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already reviewed",
            description: "You have already reviewed this product.",
            variant: "destructive",
          });
        } else if (error.message.includes('violates row-level security policy')) {
          toast({
            title: "Cannot review",
            description: "You can only review products you have purchased.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      
      // Reset form
      setRating(0);
      setComment('');
      
      // Notify parent component
      onReviewSubmitted?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-xl p-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Leave a Review</h3>
        
        {/* Star Rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Rating</label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-6 h-6 ${
                    (hoveredRating || rating) >= star
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Comment <span className="text-muted-foreground">(minimum 5 characters)</span>
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="min-h-[100px] bg-background/50 border-primary/20 focus:border-primary"
            maxLength={1000}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {comment.length}/1000 characters
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading || rating === 0 || comment.length < 5}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
};