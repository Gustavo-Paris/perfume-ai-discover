import { Review } from '@/types/review';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StarRating from './StarRating';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
  showStatus?: boolean;
}

const ReviewCard = ({ review, showStatus = false }: ReviewCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovada';
      case 'rejected':
        return 'Rejeitada';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {review.user?.name || 'Usuário Anônimo'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(review.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} readonly size="sm" />
              {showStatus && (
                <Badge className={getStatusColor(review.status)}>
                  {getStatusLabel(review.status)}
                </Badge>
              )}
            </div>
          </div>

          {/* Comment */}
          {review.comment && (
            <div className="pl-13">
              <p className="text-muted-foreground leading-relaxed">
                "{review.comment}"
              </p>
            </div>
          )}

          {/* Product info for admin view */}
          {review.perfume && (
            <div className="pl-13 pt-2 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{review.perfume.brand}</span> - {review.perfume.name}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;