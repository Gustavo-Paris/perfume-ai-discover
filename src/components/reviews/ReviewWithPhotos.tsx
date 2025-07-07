import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Upload, X, ThumbsUp, ThumbsDown, Camera, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewFormProps {
  perfumeId: string;
  onSubmit: () => void;
}

interface ReviewDisplayProps {
  review: {
    id: string;
    rating: number;
    comment: string;
    images_urls: string[];
    helpful_count: number;
    verified_purchase: boolean;
    created_at: string;
    profiles?: {
      name: string;
    };
  };
  currentUserId?: string;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ReviewFormWithPhotos = ({ perfumeId, onSubmit }: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Verificar limites
    if (images.length + files.length > MAX_IMAGES) {
      toast({
        title: "Limite de imagens",
        description: `Você pode adicionar no máximo ${MAX_IMAGES} imagens`,
        variant: "destructive"
      });
      return;
    }

    // Verificar tamanho dos arquivos
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Arquivo muito grande",
        description: "Cada imagem deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    // Verificar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast({
        title: "Formato inválido",
        description: "Apenas imagens JPG, PNG ou WebP são aceitas",
        variant: "destructive"
      });
      return;
    }

    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `reviews/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, image);

        if (uploadError) {
          throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para avaliar",
        variant: "destructive"
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Avaliação obrigatória",
        description: "Por favor, selecione uma nota de 1 a 5 estrelas",
        variant: "destructive"
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Comentário obrigatório",
        description: "Por favor, escreva um comentário sobre o perfume",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload das imagens primeiro
      const imageUrls = await uploadImages();

      // Verificar se o usuário já comprou este perfume
      const { data: purchaseData } = await supabase
        .rpc('user_has_purchased_perfume', { 
          user_uuid: user.id, 
          perfume_uuid: perfumeId 
        });

      // Criar a review
      const { error } = await supabase
        .from('reviews')
        .insert({
          perfume_id: perfumeId,
          user_id: user.id,
          rating,
          comment: comment.trim(),
          images_urls: imageUrls,
          verified_purchase: purchaseData || false,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Avaliação enviada! 🌟",
        description: "Sua avaliação será analisada e publicada em breve",
      });

      // Reset form
      setRating(0);
      setComment('');
      setImages([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onSubmit();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar avaliação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Escrever Avaliação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Sua nota *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transition-colors"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Seu comentário *</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte sua experiência com este perfume..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/1000 caracteres
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <Label>Fotos (opcional)</Label>
            <div className="space-y-4">
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < MAX_IMAGES && (
                <div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-20 border-dashed"
                  >
                    <div className="text-center">
                      <Camera className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm">
                        Adicionar Fotos ({images.length}/{MAX_IMAGES})
                      </span>
                    </div>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG ou WebP. Máximo 5MB por imagem.
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={submitting || uploading || rating === 0}
            className="w-full"
          >
            {submitting ? 'Enviando...' : uploading ? 'Fazendo upload...' : 'Enviar Avaliação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export const ReviewDisplayWithPhotos = ({ review, currentUserId }: ReviewDisplayProps) => {
  const [helpfulVote, setHelpfulVote] = useState<boolean | null>(null);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [voting, setVoting] = useState(false);

  const handleHelpfulVote = async (isHelpful: boolean) => {
    if (!currentUserId || voting) return;

    setVoting(true);
    try {
      const { error } = await supabase
        .from('review_helpfulness')
        .upsert({
          review_id: review.id,
          user_id: currentUserId,
          is_helpful: isHelpful
        });

      if (error) throw error;

      // Atualizar estado local
      if (helpfulVote === null) {
        setHelpfulCount(prev => prev + (isHelpful ? 1 : 0));
      } else if (helpfulVote !== isHelpful) {
        setHelpfulCount(prev => prev + (isHelpful ? 1 : -1));
      }

      setHelpfulVote(isHelpful);

      toast({
        title: "Voto registrado",
        description: isHelpful ? "Avaliação marcada como útil" : "Voto registrado",
      });
    } catch (error) {
      console.error('Error voting on review:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar seu voto",
        variant: "destructive"
      });
    } finally {
      setVoting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {review.verified_purchase && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Compra Verificada
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Por {review.profiles?.name || 'Usuário'} • {' '}
                {new Date(review.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Comment */}
          <p className="text-sm leading-relaxed">{review.comment}</p>

          {/* Images */}
          {review.images_urls && review.images_urls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {review.images_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Foto da avaliação ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          )}

          {/* Helpful votes */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4">
              {currentUserId && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Esta avaliação foi útil?</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHelpfulVote(true)}
                    disabled={voting}
                    className={helpfulVote === true ? 'text-green-600' : ''}
                  >
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Sim
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHelpfulVote(false)}
                    disabled={voting}
                    className={helpfulVote === false ? 'text-red-600' : ''}
                  >
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    Não
                  </Button>
                </div>
              )}
            </div>
            
            {helpfulCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {helpfulCount} pessoa{helpfulCount !== 1 ? 's' : ''} achou{helpfulCount === 1 ? '' : 'aram'} útil
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};