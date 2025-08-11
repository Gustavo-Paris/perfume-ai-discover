import { useEffect, useState } from 'react';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Macro {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  is_active: boolean;
  updated_at: string;
}

export default function AdminSupportMacros() {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Macro | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  const loadMacros = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_macros')
        .select('id, title, content, category, is_active, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setMacros((data as any) || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Não foi possível carregar as macros.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMacros(); }, []);

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setContent('');
    setIsActive(true);
  };

  const openNew = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (m: Macro) => {
    setEditing(m);
    setTitle(m.title);
    setCategory(m.category || '');
    setContent(m.content);
    setIsActive(!!m.is_active);
    setOpen(true);
  };

  const save = async () => {
    try {
      if (editing) {
        const { error } = await supabase
          .from('support_macros')
          .update({ title, content, category: category || null, is_active: isActive })
          .eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Atualizada', description: 'Macro atualizada com sucesso.' });
      } else {
        const { error } = await supabase
          .from('support_macros')
          .insert({ title, content, category: category || null, is_active: isActive });
        if (error) throw error;
        toast({ title: 'Criada', description: 'Nova macro criada com sucesso.' });
      }
      setOpen(false);
      await loadMacros();
    } catch (e) {
      toast({ title: 'Erro', description: 'Não foi possível salvar a macro.', variant: 'destructive' });
    }
  };

  const toggleActive = async (m: Macro) => {
    try {
      const { error } = await supabase
        .from('support_macros')
        .update({ is_active: !m.is_active })
        .eq('id', m.id);
      if (error) throw error;
      setMacros(prev => prev.map(mm => mm.id === m.id ? { ...mm, is_active: !mm.is_active } : mm));
    } catch (e) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
    }
  };

  const remove = async (m: Macro) => {
    if (!confirm('Excluir esta macro?')) return;
    try {
      const { error } = await supabase
        .from('support_macros')
        .delete()
        .eq('id', m.id);
      if (error) throw error;
      toast({ title: 'Excluída', description: 'Macro removida.' });
      await loadMacros();
    } catch (e) {
      toast({ title: 'Erro', description: 'Não foi possível excluir a macro.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Macros de Suporte - Admin" description="Gerencie respostas rápidas de suporte." />

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Macros de Suporte</h1>
        <p className="text-muted-foreground">Crie e mantenha respostas padronizadas para agilizar o atendimento.</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Lista de Macros</CardTitle>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Nova Macro
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {macros.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell>{m.category || '-'}</TableCell>
                    <TableCell>
                      {m.is_active ? (
                        <Badge variant="secondary">Ativa</Badge>
                      ) : (
                        <Badge variant="outline">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(m.updated_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(m)}>
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleActive(m)}>
                        {m.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => remove(m)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {macros.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {loading ? 'Carregando...' : 'Nenhuma macro cadastrada.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Macro' : 'Nova Macro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Agradecimento inicial" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria (opcional)</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Pagamento" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Conteúdo</label>
              <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Mensagem padrão da macro" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Ativa</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} disabled={!title.trim() || !content.trim()}>
                {editing ? 'Salvar alterações' : 'Criar macro'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
