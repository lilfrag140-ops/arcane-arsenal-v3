import { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    discord_username: string;
    avatar_url: string;
    discord_avatar_url: string;
  } | null;
}

interface ReviewsListProps {
  productId: string;
  refreshTrigger?: number;
}

export const ReviewsList = ({ productId, refreshTrigger }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const REVIEWS_PER_PAGE = 10;

  const fetchReviews = async (pageNum = 0, reset = false) => {
    try {
      setLoading(true);
      
      // First fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, user_id')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .range(pageNum * REVIEWS_PER_PAGE, (pageNum + 1) * REVIEWS_PER_PAGE - 1);

      if (reviewsError) throw reviewsError;

      const reviewsWithProfiles = [];
      
      if (reviewsData && reviewsData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(reviewsData.map(r => r.user_id))];
        
        // Fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, discord_username, avatar_url, discord_avatar_url')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Combine reviews with profile data
        for (const review of reviewsData) {
          const profile = profilesData?.find(p => p.user_id === review.user_id) || null;
          reviewsWithProfiles.push({
            ...review,
            profiles: profile
          });
        }
      }
      
      if (reset || pageNum === 0) {
        setReviews(reviewsWithProfiles);
      } else {
        setReviews(prev => [...prev, ...reviewsWithProfiles]);
      }
      
      setHasMore((reviewsData?.length || 0) === REVIEWS_PER_PAGE);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(0, true);
  }, [productId, refreshTrigger]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchReviews(page + 1);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-primary text-primary' 
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const getDisplayName = (profile: Review['profiles']) => {
    return profile?.discord_username || profile?.username || 'Anonymous User';
  };

  const getAvatarUrl = (profile: Review['profiles']) => {
    return profile?.discord_avatar_url || profile?.avatar_url;
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Customer Reviews</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted/20 rounded-lg h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
        <p className="text-muted-foreground">Be the first to review this product!</p>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Customer Reviews</h3>
        <div className="flex items-center space-x-2">
          {renderStars(Math.round(averageRating))}
          <span className="text-sm text-muted-foreground">
            ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div 
            key={review.id}
            className="bg-card/30 backdrop-blur-sm border border-primary/10 rounded-lg p-4 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {getAvatarUrl(review.profiles) ? (
                    <img 
                      src={getAvatarUrl(review.profiles)!} 
                      alt={getDisplayName(review.profiles)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{getDisplayName(review.profiles)}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              {renderStars(review.rating)}
            </div>
            
            <p className="text-foreground/80 leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={loadMore}
            disabled={loading}
            className="border-primary/30 hover:border-primary"
          >
            {loading ? 'Loading...' : 'Load More Reviews'}
          </Button>
        </div>
      )}
    </div>
  );
};