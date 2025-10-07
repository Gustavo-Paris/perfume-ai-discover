/**
 * Componente de visualização de logs de auditoria de segurança
 * Dashboard para administradores monitorarem atividades críticas
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Shield, Info, AlertCircle, Search, Download, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  user_id: string | null;
  event_type: string;
  event_description: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  resource_type?: string | null;
  resource_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  profiles?: {
    name: string | null;
    email: string | null;
  } | null;
}

const SecurityAuditLog = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, riskFilter, eventTypeFilter]);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      
      // Carregar perfis separadamente para evitar erro de relação
      const logsWithProfiles = await Promise.all(
        (data || []).map(async (log: any) => {
          if (log.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', log.user_id)
              .single();
            return { ...log, profiles: profile };
          }
          return log;
        })
      );

      setLogs(logsWithProfiles as AuditLog[]);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast({
        title: 'Erro ao carregar logs',
        description: 'Não foi possível carregar os logs de auditoria',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.event_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de nível de risco
    if (riskFilter !== 'all') {
      filtered = filtered.filter(log => log.risk_level === riskFilter);
    }

    // Filtro de tipo de evento
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.event_type === eventTypeFilter);
    }

    setFilteredLogs(filtered);
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Shield className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRiskBadge = (level: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'outline',
      low: 'secondary',
    };

    return (
      <Badge variant={variants[level] || 'default'} className="flex items-center gap-1">
        {getRiskIcon(level)}
        {level.toUpperCase()}
      </Badge>
    );
  };

  const exportLogs = () => {
    const csv = [
      ['Data', 'Usuário', 'Evento', 'Descrição', 'Nível de Risco', 'IP', 'User Agent'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
        log.profiles?.email || 'Sistema',
        log.event_type,
        `"${log.event_description}"`,
        log.risk_level,
        log.ip_address || '-',
        `"${log.user_agent || '-'}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const eventTypes = [...new Set(logs.map(log => log.event_type))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Logs de Auditoria de Segurança
          </CardTitle>
          <CardDescription>
            Monitoramento de eventos críticos e atividades suspeitas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Nível de risco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="low">Baixo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                {eventTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={exportLogs} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['critical', 'high', 'medium', 'low'].map(level => {
              const count = filteredLogs.filter(log => log.risk_level === level).length;
              return (
                <Card key={level}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground capitalize">{level}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                      {getRiskIcon(level)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tabela de logs */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {log.profiles?.email || 'Sistema'}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {log.event_type}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {log.event_description}
                      </TableCell>
                      <TableCell>
                        {getRiskBadge(log.risk_level)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.ip_address || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAuditLog;
