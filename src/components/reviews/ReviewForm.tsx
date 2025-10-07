import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StarRating from './StarRating';
import { useCreateReview, useUpdateReview } from '@/hooks/useReviewForm';
import { Review } from '@/types/review';
import { Loader2 } from 'lucide-react';
import { sanitizeInput } from '@/utils/securityEnhancements';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

interface ReviewFormProps {
  perfumeId: string;
  existingReview?: Review | null;
}

const ReviewForm = ({ perfumeId, existingReview }: ReviewFormProps) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const { toast } = useToast();

  const createReviewMutation = useCreateReview(perfumeId);
  const updateReviewMutation = useUpdateReview(perfumeId);

  const isUpdating = existingReview && existingReview.status === 'pending';
  const isLoading = createReviewMutation.isPending || updateReviewMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação do schema - removendo perfume_id da validação
    const validation = z.object({
      rating: z.number().int().min(1, 'Selecione uma nota de 1 a 5').max(5, 'Nota máxima é 5'),
      comment: z.string().max(500, 'Comentário muito longo').optional()
    }).safeParse({ rating, comment: comment.trim() || undefined });
    
    if (!validation.success) {
      toast({
        title: "Dados inválidos",
        description: validation.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    // Sanitizar comentário para prevenir XSS
    const sanitizedComment = comment.trim() ? sanitizeInput(comment.trim()) : undefined;

    const reviewData = {
      rating,
      comment: sanitizedComment,
    };

    if (isUpdating && existingReview) {
      updateReviewMutation.mutate({
        reviewId: existingReview.id,
        reviewData,
      });
    } else {
      createReviewMutation.mutate(reviewData);
    }
  };

  const canSubmit = rating > 0 && !isLoading;

  if (existingReview && existingReview.status === 'approved') {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700">
            <span className="font-medium">Sua avaliação foi aprovada!</span>
          </div>
          <div className="mt-2">
            <StarRating rating={existingReview.rating} readonly />
            {existingReview.comment && (
              <p className="mt-2 text-sm text-green-600">"{existingReview.comment}"</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (existingReview && existingReview.status === 'rejected') {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <span className="font-medium">Sua avaliação foi rejeitada.</span>
          </div>
          <p className="mt-1 text-sm text-red-600">
            Você pode criar uma nova avaliação seguindo nossas diretrizes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isUpdating ? 'Editar Avaliação' : 'Avaliar Produto'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Sua nota *</Label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="lg"
            />
            {rating === 0 && (
              <p className="text-sm text-muted-foreground">
                Selecione uma nota de 1 a 5 estrelas
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Conte sua experiência com este perfume..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/500 caracteres
            </p>
          </div>

          {/* Status info for pending reviews */}
          {existingReview && existingReview.status === 'pending' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-700">
                Sua avaliação está aguardando aprovação. Você pode editá-la até que seja aprovada.
              </p>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUpdating ? 'Atualizar Avaliação' : 'Enviar Avaliação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;