import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Plus, Package, Search, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Perfume {
  id: string;
  name: string;
  brand: string;
  family: string;
  gender: string;
  price_5ml: number | null;
  price_10ml: number | null;
  price_full: number;
  total_stock_ml?: number;
}

interface InventoryLot {
  id: string;
  perfume_id: string;
  lot_code: string;
  qty_ml: number;
  expiry_date: string | null;
  warehouse_id: string;
  created_at: string;
  warehouses: {
    name: string;
    location: string;
  } | null;
  perfumes: {
    name: string;
    brand: string;
  } | null;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
}

const AdminStock = () => {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPerfume, setEditingPerfume] = useState<Perfume | null>(null);
  const [editingLot, setEditingLot] = useState<InventoryLot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLotDialogOpen, setIsLotDialogOpen] = useState(false);

  const fetchPerfumes = async () => {
    try {
      // Get perfumes with aggregated stock
      const { data: perfumeData, error: perfumeError } = await supabase
        .from('perfumes')
        .select('*')
        .order('name');

      if (perfumeError) throw perfumeError;

      // Get stock totals for each perfume
      const perfumesWithStock = await Promise.all(
        (perfumeData || []).map(async (perfume) => {
          const { data: stockData } = await supabase
            .from('inventory_lots')
            .select('qty_ml')
            .eq('perfume_id', perfume.id);

          const totalStock = stockData?.reduce((sum, lot) => sum + lot.qty_ml, 0) || 0;

          return {
            ...perfume,
            total_stock_ml: totalStock
          };
        })
      );

      setPerfumes(perfumesWithStock);
    } catch (error) {
      console.error('Error fetching perfumes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfumes.",
        variant: "destructive",
      });
    }
  };

  const fetchLots = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_lots')
        .select(`
          *,
          warehouses:warehouse_id (name, location),
          perfumes:perfume_id (name, brand)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLots(data || []);
    } catch (error) {
      console.error('Error fetching lots:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lotes.",
        variant: "destructive",
      });
    }
  };

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchPerfumes(), fetchLots(), fetchWarehouses()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSavePerfume = async (perfumeData: Partial<Perfume>) => {
    try {
      if (editingPerfume?.id) {
        // Update existing perfume
        const { error } = await supabase
          .from('perfumes')
          .update(perfumeData)
          .eq('id', editingPerfume.id);

        if (error) throw error;

        toast({
          title: "Perfume atualizado",
          description: "Perfume atualizado com sucesso.",
        });
      } else {
        // Create new perfume
        const { error } = await supabase
          .from('perfumes')
          .insert(perfumeData);

        if (error) throw error;

        toast({
          title: "Perfume criado",
          description: "Novo perfume criado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingPerfume(null);
      fetchPerfumes();
    } catch (error) {
      console.error('Error saving perfume:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar perfume.",
        variant: "destructive",
      });
    }
  };

  const handleSaveLot = async (lotData: Partial<InventoryLot>) => {
    try {
      if (editingLot?.id) {
        // Update existing lot
        const { error } = await supabase
          .from('inventory_lots')
          .update(lotData)
          .eq('id', editingLot.id);

        if (error) throw error;

        toast({
          title: "Lote atualizado",
          description: "Lote atualizado com sucesso.",
        });
      } else {
        // Create new lot
        const { error } = await supabase
          .from('inventory_lots')
          .insert(lotData);

        if (error) throw error;

        toast({
          title: "Lote criado",
          description: "Novo lote criado com sucesso.",
        });
      }

      setIsLotDialogOpen(false);
      setEditingLot(null);
      fetchLots();
      fetchPerfumes(); // Refresh stock totals
    } catch (error) {
      console.error('Error saving lot:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar lote.",
        variant: "destructive",
      });
    }
  };

  const filteredPerfumes = perfumes.filter(perfume =>
    perfume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perfume.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLots = lots.filter(lot =>
    lot.lot_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lot.perfumes?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lot.perfumes?.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando estoque...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie perfumes e lotes de estoque
          </p>
        </div>
      </div>

      <Tabs defaultValue="perfumes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="perfumes">Perfumes</TabsTrigger>
          <TabsTrigger value="lots">Lotes</TabsTrigger>
        </TabsList>

        <TabsContent value="perfumes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Perfumes
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingPerfume(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Perfume
                    </Button>
                  </DialogTrigger>
                  <PerfumeDialog 
                    perfume={editingPerfume} 
                    onSave={handleSavePerfume}
                    onClose={() => setIsDialogOpen(false)}
                  />
                </Dialog>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar perfumes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Família</TableHead>
                    <TableHead>Gênero</TableHead>
                    <TableHead>Estoque (ml)</TableHead>
                    <TableHead>Preços</TableHead>
                    <TableHead className="w-12">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPerfumes.map((perfume) => (
                    <TableRow key={perfume.id}>
                      <TableCell className="font-medium">{perfume.name}</TableCell>
                      <TableCell>{perfume.brand}</TableCell>
                      <TableCell>{perfume.family}</TableCell>
                      <TableCell>{perfume.gender}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {perfume.total_stock_ml || 0}ml
                          {(perfume.total_stock_ml || 0) < 100 && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {perfume.price_5ml && (
                            <div>5ml: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(perfume.price_5ml)}</div>
                          )}
                          {perfume.price_10ml && (
                            <div>10ml: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(perfume.price_10ml)}</div>
                          )}
                          <div>Full: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(perfume.price_full)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingPerfume(perfume);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lots" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Lotes de Estoque</CardTitle>
                <Dialog open={isLotDialogOpen} onOpenChange={setIsLotDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingLot(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Lote
                    </Button>
                  </DialogTrigger>
                  <LotDialog 
                    lot={editingLot} 
                    perfumes={perfumes}
                    warehouses={warehouses}
                    onSave={handleSaveLot}
                    onClose={() => setIsLotDialogOpen(false)}
                  />
                </Dialog>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar lotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código do Lote</TableHead>
                    <TableHead>Perfume</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Depósito</TableHead>
                    <TableHead className="w-12">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLots.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{lot.lot_code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lot.perfumes?.name}</div>
                          <div className="text-sm text-muted-foreground">{lot.perfumes?.brand}</div>
                        </div>
                      </TableCell>
                      <TableCell>{lot.qty_ml}ml</TableCell>
                      <TableCell>
                        {lot.expiry_date ? (
                          <Badge variant={new Date(lot.expiry_date) < new Date() ? "destructive" : "secondary"}>
                            {new Date(lot.expiry_date).toLocaleDateString('pt-BR')}
                          </Badge>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>{lot.warehouses?.name}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingLot(lot);
                            setIsLotDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Perfume Dialog Component
interface PerfumeDialogProps {
  perfume: Perfume | null;
  onSave: (data: Partial<Perfume>) => void;
  onClose: () => void;
}

function PerfumeDialog({ perfume, onSave, onClose }: PerfumeDialogProps) {
  const [formData, setFormData] = useState<Partial<Perfume>>({
    name: '',
    brand: '',
    family: '',
    gender: 'unisex',
    price_5ml: null,
    price_10ml: null,
    price_full: 0,
  });

  useEffect(() => {
    if (perfume) {
      setFormData(perfume);
    } else {
      setFormData({
        name: '',
        brand: '',
        family: '',
        gender: 'unisex',
        price_5ml: null,
        price_10ml: null,
        price_full: 0,
      });
    }
  }, [perfume]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {perfume ? 'Editar Perfume' : 'Novo Perfume'}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="brand">Marca</Label>
          <Input
            id="brand"
            value={formData.brand || ''}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="family">Família Olfativa</Label>
          <Input
            id="family"
            value={formData.family || ''}
            onChange={(e) => setFormData({ ...formData, family: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="gender">Gênero</Label>
          <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="feminino">Feminino</SelectItem>
              <SelectItem value="unisex">Unissex</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="price_5ml">Preço 5ml</Label>
            <Input
              id="price_5ml"
              type="number"
              step="0.01"
              value={formData.price_5ml || ''}
              onChange={(e) => setFormData({ ...formData, price_5ml: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
          <div>
            <Label htmlFor="price_10ml">Preço 10ml</Label>
            <Input
              id="price_10ml"
              type="number"
              step="0.01"
              value={formData.price_10ml || ''}
              onChange={(e) => setFormData({ ...formData, price_10ml: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
          <div>
            <Label htmlFor="price_full">Preço Full</Label>
            <Input
              id="price_full"
              type="number"
              step="0.01"
              value={formData.price_full || 0}
              onChange={(e) => setFormData({ ...formData, price_full: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            Salvar
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

// Lot Dialog Component
interface LotDialogProps {
  lot: InventoryLot | null;
  perfumes: Perfume[];
  warehouses: Warehouse[];
  onSave: (data: Partial<InventoryLot>) => void;
  onClose: () => void;
}

function LotDialog({ lot, perfumes, warehouses, onSave, onClose }: LotDialogProps) {
  const [formData, setFormData] = useState<Partial<InventoryLot>>({
    perfume_id: '',
    lot_code: '',
    qty_ml: 0,
    expiry_date: null,
    warehouse_id: '',
  });

  useEffect(() => {
    if (lot) {
      setFormData(lot);
    } else {
      setFormData({
        perfume_id: '',
        lot_code: '',
        qty_ml: 0,
        expiry_date: null,
        warehouse_id: '',
      });
    }
  }, [lot]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {lot ? 'Editar Lote' : 'Novo Lote'}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="perfume_id">Perfume</Label>
          <Select value={formData.perfume_id} onValueChange={(value) => setFormData({ ...formData, perfume_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um perfume" />
            </SelectTrigger>
            <SelectContent>
              {perfumes.map((perfume) => (
                <SelectItem key={perfume.id} value={perfume.id}>
                  {perfume.brand} - {perfume.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="lot_code">Código do Lote</Label>
          <Input
            id="lot_code"
            value={formData.lot_code || ''}
            onChange={(e) => setFormData({ ...formData, lot_code: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="qty_ml">Quantidade (ml)</Label>
          <Input
            id="qty_ml"
            type="number"
            value={formData.qty_ml || 0}
            onChange={(e) => setFormData({ ...formData, qty_ml: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="expiry_date">Data de Validade</Label>
          <Input
            id="expiry_date"
            type="date"
            value={formData.expiry_date || ''}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value || null })}
          />
        </div>
        <div>
          <Label htmlFor="warehouse_id">Depósito</Label>
          <Select value={formData.warehouse_id} onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um depósito" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} - {warehouse.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            Salvar
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

export default AdminStock;