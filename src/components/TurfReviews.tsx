import { useState, useEffect } from 'react';
import { Star, User, Send, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { usePublicAuth } from '@/hooks/usePublicAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_name?: string;
}

interface TurfReviewsProps {
  turfId: string;
  avgRating: number;
  reviewCount: number;
  onReviewAdded?: () => void;
}

export function TurfReviews({ turfId, avgRating, reviewCount, onReviewAdded }: TurfReviewsProps) {
  const { user, profile } = usePublicAuth();
  const { toast } = useToast();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (user) {
      checkIfReviewed();
    }
  }, [turfId, user]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('turf_reviews')
      .select('*')
      .eq('turf_id', turfId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get user names from public_profiles
    const reviewsWithNames = await Promise.all((data || []).map(async (review: any) => {
      const { data: profileData } = await supabase
        .from('public_profiles')
        .select('name')
        .eq('user_id', review.user_id)
        .maybeSingle();
      
      return {
        ...review,
        user_name: profileData?.name || 'Anonymous'
      };
    }));
    
    setReviews(reviewsWithNames);
    setLoading(false);
  };

  const checkIfReviewed = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('turf_reviews')
      .select('id')
      .eq('turf_id', turfId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    setHasReviewed(!!data);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to leave a review', variant: 'destructive' });
      return;
    }
    
    setSubmitting(true);
    
    const { error } = await supabase
      .from('turf_reviews')
      .insert({
        turf_id: turfId,
        user_id: user.id,
        rating,
        review_text: reviewText || null,
      });
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Thank You!', description: 'Your review has been submitted' });
      setShowForm(false);
      setReviewText('');
      setRating(5);
      fetchReviews();
      onReviewAdded?.();
    }
    
    setSubmitting(false);
  };

  const StarRating = ({ value, onChange, size = 'md', interactive = false }: {
    value: number;
    onChange?: (val: number) => void;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
  }) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-7 h-7'
    };
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={cn(
              "transition-colors",
              interactive ? "cursor-pointer" : "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                (interactive ? (hoverRating || value) : value) >= star
                  ? "text-amber-400 fill-amber-400"
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">{avgRating?.toFixed(1) || '0.0'}</div>
            <StarRating value={Math.round(avgRating || 0)} size="sm" />
            <p className="text-gray-500 text-sm mt-1">{reviewCount} reviews</p>
          </div>
        </div>
        
        {user && !hasReviewed && (
          <Button
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? 'outline' : 'default'}
            className={cn(!showForm && 'bg-emerald-500 hover:bg-emerald-600')}
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl p-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Your Rating</p>
            <StarRating value={rating} onChange={setRating} size="lg" interactive />
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Your Review (Optional)</p>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
            />
          </div>
          
          <Button
            onClick={handleSubmitReview}
            disabled={submitting}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
            <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="font-medium text-emerald-600">
                      {review.user_name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{review.user_name}</p>
                    <p className="text-gray-500 text-xs">
                      {format(parseISO(review.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <StarRating value={review.rating} size="sm" />
              </div>
              
              {review.review_text && (
                <p className="text-gray-700 mt-2">{review.review_text}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}