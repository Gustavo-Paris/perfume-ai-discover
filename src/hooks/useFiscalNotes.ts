import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { FiscalNote } from '@/types/fiscal';

export const useFiscalNotes = () => {
  const [fiscalNotes, setFiscalNotes] = useState<FiscalNote[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadFiscalNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fiscal_notes')
        .select(`
          *,
          order:orders (
            order_number,
            user_id,
            address_data
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiscalNotes(data || []);
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar notas fiscais",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNFE = async (orderId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-nfe', {
        body: { order_id: orderId }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "NF-e gerada com sucesso"
      });

      loadFiscalNotes();
      return data;
    } catch (error: any) {
      console.error('Erro ao gerar NF-e:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar NF-e",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getUserFiscalNotes = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fiscal_notes')
        .select(`
          *,
          order:orders!inner (
            order_number,
            user_id,
            address_data
          )
        `)
        .eq('order.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar notas do usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar suas notas fiscais",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const resendNFEEmail = async (fiscalNoteId: string, email: string) => {
    setLoading(true);
    try {
      const { data: fiscalNote, error } = await supabase
        .from('fiscal_notes')
        .select(`
          *,
          order:orders (order_number, address_data)
        `)
        .eq('id', fiscalNoteId)
        .single();

      if (error) throw error;

      if (!fiscalNote.pdf_url) {
        throw new Error('PDF da NF-e não disponível');
      }

      await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          template: 'nfe_generated',
          data: {
            customerName: (fiscalNote as any).order.address_data.name,
            orderNumber: (fiscalNote as any).order.order_number,
            nfeNumber: fiscalNote.numero,
            nfeKey: fiscalNote.chave_acesso,
            pdfUrl: fiscalNote.pdf_url
          }
        }
      });

      toast({
        title: "Sucesso",
        description: "Email da NF-e reenviado com sucesso"
      });
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao reenviar email da NF-e",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiscalNotes();
  }, []);

  return {
    fiscalNotes,
    loading,
    loadFiscalNotes,
    generateNFE,
    getUserFiscalNotes,
    resendNFEEmail
  };
};