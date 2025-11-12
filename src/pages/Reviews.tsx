import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ChevronLeft, ChevronRight, User, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
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

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // First fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(20);

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
      
      setReviews(reviewsWithProfiles);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
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

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="bg-muted/20 rounded-lg h-12 w-64 mx-auto"></div>
            <div className="bg-muted/20 rounded-lg h-96 max-w-2xl mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            <span className="gradient-text glow-text">Customer Reviews</span>
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto mb-6">
            See what our community thinks about their DonutSMP experience
          </p>
          
          {reviews.length > 0 && (
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                {renderStars(Math.round(averageRating))}
                <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
              </div>
              <Badge className="bg-primary/20 text-foreground border-primary/30 px-3 py-1">
                {reviews.length} Review{reviews.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </motion.div>

        {reviews.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <Quote className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground">Be the first to leave a review after your purchase!</p>
          </motion.div>
        ) : (
          /* Reviews Carousel */
          <div className="max-w-4xl mx-auto relative">
            <div className="relative overflow-hidden rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 300, rotateY: 15 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: -300, rotateY: -15 }}
                  transition={{ 
                    duration: 0.6, 
                    ease: [0.4, 0, 0.2, 1],
                    type: "spring",
                    stiffness: 100
                  }}
                  className="w-full"
                >
                  <Card className="bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-md border-2 border-primary/20 shadow-2xl hover:shadow-primary/20 transition-all duration-500">
                    <CardContent className="p-8 md:p-12">
                      <div className="flex flex-col items-center text-center space-y-6">
                        {/* User Avatar & Info */}
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5">
                              <div className="w-full h-full rounded-full bg-card/50 flex items-center justify-center overflow-hidden">
                                {getAvatarUrl(reviews[currentIndex].profiles) ? (
                                  <img 
                                    src={getAvatarUrl(reviews[currentIndex].profiles)!} 
                                    alt={getDisplayName(reviews[currentIndex].profiles)}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-8 h-8 text-primary" />
                                )}
                              </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-primary/20 rounded-full p-2">
                              <Quote className="w-4 h-4 text-primary" />
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-xl font-semibold">
                              {getDisplayName(reviews[currentIndex].profiles)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(reviews[currentIndex].created_at), 'MMMM d, yyyy')}
                            </p>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center space-x-2">
                          {renderStars(reviews[currentIndex].rating)}
                          <span className="text-lg font-medium">
                            {reviews[currentIndex].rating}/5
                          </span>
                        </div>

                        {/* Review Comment */}
                        <blockquote className="text-lg md:text-xl leading-relaxed text-foreground/90 max-w-2xl italic">
                          "{reviews[currentIndex].comment}"
                        </blockquote>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            {reviews.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevReview}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm border border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all duration-300 hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextReview}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm border border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all duration-300 hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>

                {/* Dots Indicator */}
                <div className="flex justify-center mt-8 space-x-2">
                  {reviews.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentIndex
                          ? 'bg-primary scale-125'
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold mb-4">Share Your Experience</h3>
            <p className="text-muted-foreground mb-6">
              Purchase any item and leave a review to help other players make the right choice!
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-3"
            >
              Shop Now
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Reviews;