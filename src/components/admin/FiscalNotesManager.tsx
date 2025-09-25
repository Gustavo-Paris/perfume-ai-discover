import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, Eye, RefreshCw } from 'lucide-react';

interface FiscalNote {
  id: string;
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFiscalNotes();
  }, []);

  const loadFiscalNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('fiscal_notes_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiscalNotes(data || []);
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
        <Button onClick={loadFiscalNotes} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {fiscalNotes.map((fiscalNote) => (
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
                    <p className="text-xs text-red-500 mt-1">
                      Erro: {fiscalNote.erro_message}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(fiscalNote.status)}>
                    {getStatusText(fiscalNote.status)}
                  </Badge>
                  
                  <div className="flex gap-2">
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