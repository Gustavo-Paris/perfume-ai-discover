import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Star, CheckCircle, XCircle, Clock, Eye, Filter, Zap, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  usePendingReviews, 
  useAutoModerateReview, 
  useBulkModerateReviews,
  useReviewModerationStats,
  useReviewsWithFilters,
  ReviewWithModeration 
} from '@/hooks/useReviewModeration';
import { toast } from '@/hooks/use-toast';

const ReviewModerationPanel = () => {
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | ''>('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: [] as string[],
    rating: [] as number[],
    tags: [] as string[]
  });

  const { data: pendingData, isLoading: pendingLoading } = usePendingReviews(currentPage);
  const { data: stats } = useReviewModerationStats();
  const { data: filteredData } = useReviewsWithFilters({ ...filters, page: currentPage });
  const autoModerate = useAutoModerateReview();
  const bulkModerate = useBulkModerateReviews();

  const handleSelectReview = (reviewId: string) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleSelectAll = () => {
    const currentReviews = pendingData?.reviews || [];
    if (selectedReviews.length === currentReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(currentReviews.map(r => r.id));
    }
  };

  const handleAutoModerate = async (review: ReviewWithModeration) => {
    try {
      await autoModerate.mutateAsync({
        reviewId: review.id,
        comment: review.comment || '',
        rating: review.rating
      });
      
      toast({
        title: "Moderação automática concluída",
        description: "A avaliação foi processada pela IA",
      });
    } catch (error) {
      toast({
        title: "Erro na moderação automática",
        description: "Não foi possível processar a avaliação",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedReviews.length === 0) return;

    try {
      await bulkModerate.mutateAsync({
        reviewIds: selectedReviews,
        action: bulkAction
      });

      toast({
        title: `${selectedReviews.length} avaliações ${bulkAction === 'approve' ? 'aprovadas' : 'rejeitadas'}`,
        description: "As avaliações foram processadas com sucesso",
      });

      setSelectedReviews([]);
      setShowBulkDialog(false);
      setBulkAction('');
    } catch (error) {
      toast({
        title: "Erro na ação em lote",
        description: "Não foi possível processar as avaliações",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'spam': return 'bg-red-100 text-red-700';
      case 'offensive': return 'bg-red-100 text-red-700';
      case 'fake': return 'bg-orange-100 text-orange-700';
      case 'positive': return 'bg-green-100 text-green-700';
      case 'negative': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Aprovadas</p>
                  <p className="text-2xl font-bold">{stats?.approved || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Rejeitadas</p>
                  <p className="text-2xl font-bold">{stats?.rejected || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="filtered">Filtros Avançados</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* Bulk Actions */}
          {selectedReviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 p-4 rounded-lg border border-blue-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedReviews.length} avaliação(ões) selecionada(s)
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setBulkAction('approve');
                      setShowBulkDialog(true);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setBulkAction('reject');
                      setShowBulkDialog(true);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Reviews List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Avaliações Pendentes</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedReviews.length === pendingData?.reviews.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <AnimatePresence>
                  <div className="space-y-4">
                    {pendingData?.reviews.map((review, index) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedReviews.includes(review.id)}
                            onCheckedChange={() => handleSelectReview(review.id)}
                          />
                          
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(review.status)}>
                                  {review.status}
                                </Badge>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= review.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            <div>
                              <p className="font-medium">
                                {review.perfume?.brand} - {review.perfume?.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Por: {review.user?.name || 'Usuário desconhecido'}
                              </p>
                            </div>

                            {review.comment && (
                              <p className="text-sm bg-gray-50 p-3 rounded">
                                "{review.comment}"
                              </p>
                            )}

                            {review.moderation_result && (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-1">
                                  {review.moderation_result.tags.map(tag => (
                                    <Badge key={tag} className={getTagColor(tag)} variant="outline">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Confiança: {Math.round(review.moderation_result.confidence * 100)}%
                                  {review.moderation_result.reason && ` - ${review.moderation_result.reason}`}
                                </p>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAutoModerate(review)}
                                disabled={autoModerate.isPending}
                                variant="outline"
                              >
                                <Zap className="w-4 h-4 mr-1" />
                                {autoModerate.isPending ? 'Processando...' : 'Auto-Moderar'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filtered">
          <Card>
            <CardHeader>
              <CardTitle>Filtros Avançados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label>Status</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Avaliação</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar nota" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map(rating => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {rating} estrela{rating !== 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tags de Moderação</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spam">Spam</SelectItem>
                      <SelectItem value="offensive">Ofensivo</SelectItem>
                      <SelectItem value="fake">Falso</SelectItem>
                      <SelectItem value="positive">Positivo</SelectItem>
                      <SelectItem value="negative">Negativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button>
                <Filter className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gráficos e métricas de performance das avaliações serão implementados aqui.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Action Dialog */}
      <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'approve' ? 'Aprovar' : 'Rejeitar'} Avaliações
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a {bulkAction === 'approve' ? 'aprovar' : 'rejeitar'} {selectedReviews.length} avaliação(ões).
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              disabled={bulkModerate.isPending}
              className={bulkAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {bulkModerate.isPending ? 'Processando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReviewModerationPanel;