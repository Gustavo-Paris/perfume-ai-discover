import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useReviews, useReviewStats } from '@/hooks/useReviews';
import ReviewCard from './ReviewCard';
import StarRating from './StarRating';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

interface ReviewListProps {
  perfumeId: string;
}

const ReviewList = ({ perfumeId }: ReviewListProps) => {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(false);
  
  const { data: reviewsData, isLoading } = useReviews(perfumeId, page, 5);
  const { data: stats } = useReviewStats(perfumeId);

  if (isLoading && page === 1) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">
            Ainda não há avaliações
          </h3>
          <p className="text-muted-foreground">
            Seja o primeiro a avaliar este perfume!
          </p>
        </CardContent>
      </Card>
    );
  }

  const reviews = reviewsData?.reviews || [];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Avaliações ({stats.total})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Rating */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{stats.average}</span>
              <StarRating rating={stats.average} readonly />
            </div>
            <div className="text-sm text-muted-foreground">
              Baseado em {stats.total} {stats.total === 1 ? 'avaliação' : 'avaliações'}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3 text-sm">
                  <span className="w-8 text-right">{rating}</span>
                  <StarRating rating={rating} readonly size="sm" />
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="w-8 text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Toggle Button */}
          <Button
            variant="outline"
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-4"
          >
            {expanded ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Ocultar Avaliações
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Ver Todas as Avaliações
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {expanded && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {/* Load More */}
          {reviewsData?.hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={isLoading}
              >
                {isLoading ? 'Carregando...' : 'Carregar Mais'}
              </Button>
            </div>
          )}

          {reviews.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  Nenhuma avaliação aprovada ainda.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewList;