import { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, Calendar, Package, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { FiscalNote } from '@/types/fiscal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MinhasNotasFiscais = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [fiscalNotes, setFiscalNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadFiscalNotes();
  }, [user]);

  const loadFiscalNotes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fiscal_notes')
        .select(`
          *,
          order:orders!inner (
            order_number,
            user_id,
            address_data,
            total_amount,
            created_at
          ),
          fiscal_note_items (
            *,
            order_item:order_items (
              *,
              perfume:perfumes (
                name,
                brand
              )
            )
          )
        `)
        .eq('order.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiscalNotes(data || []);
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar suas notas fiscais",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      authorized: 'default',
      rejected: 'destructive',
      cancelled: 'outline'
    } as const;

    const labels = {
      pending: 'Processando',
      authorized: 'Autorizada',
      rejected: 'Rejeitada',
      cancelled: 'Cancelada'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openDetails = (note: any) => {
    setSelectedNote(note);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando suas notas fiscais...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Minhas Notas Fiscais</h1>
          <p className="text-muted-foreground">
            Visualize e baixe suas notas fiscais eletrônicas
          </p>
        </div>
      </div>

      {fiscalNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma nota fiscal encontrada</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Suas notas fiscais eletrônicas aparecerão aqui após a confirmação do pagamento dos pedidos.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => navigate('/catalogo')}
            >
              <Package className="h-4 w-4 mr-2" />
              Ver Catálogo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {fiscalNotes.map((note) => (
            <Card key={note.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      NF-e #{note.numero}
                      {getStatusBadge(note.status)}
                    </CardTitle>
                    <CardDescription>
                      Pedido #{note.order.order_number} • {formatDate(note.data_emissao)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatCurrency(note.valor_total)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Série {note.serie}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetails(note)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  
                  {note.pdf_url && note.status === 'authorized' && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={note.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PDF
                      </a>
                    </Button>
                  )}
                </div>

                {note.chave_acesso && (
                  <div className="bg-muted p-3 rounded text-sm">
                    <div className="font-semibold mb-1">Chave de Acesso:</div>
                    <div className="font-mono text-xs break-all">
                      {note.chave_acesso}
                    </div>
                  </div>
                )}

                {note.erro_message && (
                  <div className="bg-destructive/10 border border-destructive/20 p-3 rounded text-sm text-destructive">
                    <div className="font-semibold mb-1">Erro:</div>
                    <div>{note.erro_message}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes da NF-e #{selectedNote?.numero}
            </DialogTitle>
          </DialogHeader>
          
          {selectedNote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedNote.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold">Data de Emissão</label>
                  <div className="mt-1">{formatDate(selectedNote.data_emissao)}</div>
                </div>
                <div>
                  <label className="text-sm font-semibold">Série</label>
                  <div className="mt-1">{selectedNote.serie}</div>
                </div>
                <div>
                  <label className="text-sm font-semibold">Valor Total</label>
                  <div className="mt-1 font-semibold">
                    {formatCurrency(selectedNote.valor_total)}
                  </div>
                </div>
              </div>

              {selectedNote.chave_acesso && (
                <div>
                  <label className="text-sm font-semibold">Chave de Acesso</label>
                  <div className="mt-1 p-2 bg-muted rounded font-mono text-xs break-all">
                    {selectedNote.chave_acesso}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold">Itens da Nota</label>
                <div className="mt-2 space-y-2">
                  {selectedNote.fiscal_note_items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded">
                      <div>
                        <div className="font-medium">
                          {item.order_item?.perfume?.brand} - {item.order_item?.perfume?.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantidade}x {item.unidade_comercial} • NCM: {item.ncm}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(item.valor_total)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Unit.: {formatCurrency(item.valor_unitario)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedNote.pdf_url && selectedNote.status === 'authorized' && (
                <div className="flex justify-center pt-4">
                  <Button asChild>
                    <a 
                      href={selectedNote.pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar NF-e (PDF)
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MinhasNotasFiscais;