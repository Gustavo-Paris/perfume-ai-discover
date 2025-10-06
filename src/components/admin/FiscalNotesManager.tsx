import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, Eye, RefreshCw, AlertCircle, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FiscalNote {
  id: string;
  order_id: string;
  order_number: string;
  numero: number;
  serie: number;
  status: string;
  chave_acesso?: string;
  data_emissao: string;
  valor_total: number;
  pdf_url?: string;
  xml_content?: string;
  erro_message?: string;
  items_count: number;
}

export const FiscalNotesManager = () => {
  const [fiscalNotes, setFiscalNotes] = useState<FiscalNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<FiscalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingNoteId, setRetryingNoteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadFiscalNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [fiscalNotes, statusFilter]);

  const loadFiscalNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('fiscal_notes')
        .select(`
          *,
          order:orders!inner(order_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = data?.map(note => ({
        ...note,
        order_number: note.order.order_number,
        items_count: 0 // Will be populated from fiscal_note_items if needed
      })) || [];
      
      setFiscalNotes(formattedData);
    } catch (error) {
      console.error('Error loading fiscal notes:', error);
      toast({
        title: "Erro ao Carregar NF-e",
        description: "Não foi possível carregar as notas fiscais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = fiscalNotes;
    
    if (statusFilter === 'error') {
      filtered = fiscalNotes.filter(note => 
        note.status === 'rejected' || note.erro_message
      );
    } else if (statusFilter !== 'all') {
      filtered = fiscalNotes.filter(note => note.status === statusFilter);
    }
    
    setFilteredNotes(filtered);
  };

  const retryNFeGeneration = async (orderId: string, noteId: string) => {
    setRetryingNoteId(noteId);
    try {
      const { data, error } = await supabase.functions.invoke('retry-nfe-generation', {
        body: { order_id: orderId }
      });

      if (error) throw error;

      toast({
        title: "NF-e Regenerada",
        description: "A nota fiscal foi regenerada com sucesso.",
      });

      loadFiscalNotes();
    } catch (error) {
      console.error('Error retrying NF-e generation:', error);
      toast({
        title: "Erro ao Regenerar NF-e",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setRetryingNoteId(null);
    }
  };

  const downloadPdf = async (fiscalNote: FiscalNote) => {
    if (!fiscalNote.pdf_url) {
      toast({
        title: "PDF não disponível",
        description: "O PDF da NF-e não está disponível.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a link to download the PDF
      const link = document.createElement('a');
      link.href = fiscalNote.pdf_url;
      link.target = '_blank';
      link.download = `nfe-${fiscalNote.numero}-serie-${fiscalNote.serie}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "PDF Baixado",
        description: "O PDF da NF-e foi aberto para download.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Erro ao baixar PDF",
        description: "Não foi possível baixar o PDF da NF-e.",
        variant: "destructive",
      });
    }
  };

  const downloadXml = async (fiscalNote: FiscalNote) => {
    if (!fiscalNote.xml_content) {
      toast({
        title: "XML não disponível",
        description: "O XML da NF-e não está disponível.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a blob and download the XML
      const blob = new Blob([fiscalNote.xml_content], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nfe-${fiscalNote.numero}-serie-${fiscalNote.serie}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "XML Baixado",
        description: "O XML da NF-e foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Error downloading XML:', error);
      toast({
        title: "Erro ao baixar XML",
        description: "Não foi possível baixar o XML da NF-e.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authorized': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'authorized': return 'Autorizada';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  if (loading) {
    return <div className="p-6">Carregando notas fiscais...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notas Fiscais Eletrônicas</h2>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="authorized">✅ Autorizadas</SelectItem>
              <SelectItem value="pending">⏳ Pendentes</SelectItem>
              <SelectItem value="error">❌ Com Erro</SelectItem>
              <SelectItem value="cancelled">🚫 Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadFiscalNotes} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredNotes.map((fiscalNote) => (
          <Card key={fiscalNote.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    NF-e {fiscalNote.numero.toString().padStart(6, '0')} - Série {fiscalNote.serie}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Pedido: {fiscalNote.order_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Emissão: {new Date(fiscalNote.data_emissao).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Valor: R$ {fiscalNote.valor_total.toFixed(2)} | 
                    {fiscalNote.items_count} item(s)
                  </p>
                  {fiscalNote.chave_acesso && (
                    <p className="text-xs text-muted-foreground font-mono">
                      Chave: {fiscalNote.chave_acesso}
                    </p>
                  )}
                  {fiscalNote.erro_message && (
                    <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-red-700">Erro na geração:</p>
                        <p className="text-xs text-red-600">{fiscalNote.erro_message}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(fiscalNote.status)}>
                    {getStatusText(fiscalNote.status)}
                  </Badge>
                  
                  <div className="flex gap-2">
                    {(fiscalNote.status === 'rejected' || fiscalNote.erro_message) && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => retryNFeGeneration(fiscalNote.order_id, fiscalNote.id)}
                        disabled={retryingNoteId === fiscalNote.id}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {retryingNoteId === fiscalNote.id ? 'Processando...' : 'Tentar Novamente'}
                      </Button>
                    )}
                    
                    {fiscalNote.pdf_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadPdf(fiscalNote)}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </Button>
                    )}
                    
                    {fiscalNote.xml_content && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadXml(fiscalNote)}
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        XML
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => window.open(`https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?chNFe=${fiscalNote.chave_acesso}`, '_blank')}
                      disabled={!fiscalNote.chave_acesso}
                    >
                      <Eye className="w-4 h-4" />
                      Consultar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && fiscalNotes.length > 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma nota encontrada</h3>
            <p className="text-muted-foreground">
              Não há notas fiscais com o filtro selecionado.
            </p>
          </CardContent>
        </Card>
      )}

      {fiscalNotes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma nota fiscal encontrada</h3>
            <p className="text-muted-foreground">
              As notas fiscais aparecerão aqui após serem emitidas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};