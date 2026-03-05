import { useState, useMemo } from 'react';
import { Equipment, MAINTENANCE_TYPES, ServiceOrder, ServiceOrderPriority, ServiceOrderStatus } from '@/types/equipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, Plus, Trash2, CheckCircle2, Clock, AlertCircle, XCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ServiceOrdersCardProps {
  equipment: Equipment[];
  orders: ServiceOrder[];
  onAddOrder: (order: ServiceOrder) => void;
  onUpdateOrder: (orderId: string, changes: Partial<ServiceOrder>) => void;
  onDeleteOrder: (orderId: string) => void;
}

function generateOsNumber(orders: ServiceOrder[]): string {
  const year = new Date().getFullYear();
  const prefix = `OS-${year}-`;
  const maxNum = orders
    .map(o => {
      const match = o.numero.match(new RegExp(`^${prefix}(\\d+)$`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
}

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const PRIORITY_LABELS: Record<ServiceOrderPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

function StatusBadge({ status }: { status: ServiceOrderStatus }) {
  const variants: Record<ServiceOrderStatus, string> = {
    aberta: 'bg-blue-100 text-blue-800 border-blue-300',
    em_andamento: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    concluida: 'bg-green-100 text-green-800 border-green-300',
    cancelada: 'bg-gray-100 text-gray-600 border-gray-300',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${variants[status]}`}>
      {status === 'aberta' && <Clock size={12} />}
      {status === 'em_andamento' && <AlertCircle size={12} />}
      {status === 'concluida' && <CheckCircle2 size={12} />}
      {status === 'cancelada' && <XCircle size={12} />}
      {STATUS_LABELS[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: ServiceOrderPriority }) {
  const variants: Record<ServiceOrderPriority, string> = {
    baixa: 'bg-slate-100 text-slate-700',
    media: 'bg-blue-100 text-blue-700',
    alta: 'bg-orange-100 text-orange-700',
    urgente: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${variants[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function ServiceOrdersCard({
  equipment,
  orders,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
}: ServiceOrdersCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ServiceOrderStatus | 'todas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Form fields
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [tipoManutencao, setTipoManutencao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [prioridade, setPrioridade] = useState<ServiceOrderPriority>('media');
  const [dataPrevista, setDataPrevista] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const sortedEquipment = useMemo(
    () => [...equipment].sort((a, b) => a.tag.localeCompare(b.tag)),
    [equipment]
  );

  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => filterStatus === 'todas' || o.status === filterStatus)
      .filter(o => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          o.numero.toLowerCase().includes(term) ||
          o.equipmentTag.toLowerCase().includes(term) ||
          o.area.toLowerCase().includes(term) ||
          o.tipoManutencao.toLowerCase().includes(term) ||
          o.responsavel.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime());
  }, [orders, filterStatus, searchTerm]);

  const stats = useMemo(() => ({
    total: orders.length,
    abertas: orders.filter(o => o.status === 'aberta').length,
    emAndamento: orders.filter(o => o.status === 'em_andamento').length,
    concluidas: orders.filter(o => o.status === 'concluida').length,
    canceladas: orders.filter(o => o.status === 'cancelada').length,
  }), [orders]);

  const resetForm = () => {
    setSelectedEquipmentId('');
    setTipoManutencao('');
    setDescricao('');
    setResponsavel('');
    setPrioridade('media');
    setDataPrevista('');
    setObservacoes('');
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const eq = equipment.find(x => x.id === selectedEquipmentId);
    if (!eq) {
      toast.error('Selecione um equipamento');
      return;
    }
    if (!tipoManutencao) {
      toast.error('Selecione o tipo de manutenção');
      return;
    }
    if (!descricao.trim()) {
      toast.error('Informe a descrição do serviço');
      return;
    }

    const order: ServiceOrder = {
      id: crypto.randomUUID(),
      numero: generateOsNumber(orders),
      equipmentId: eq.id,
      equipmentTag: eq.tag,
      area: eq.area,
      tipoManutencao,
      descricao: descricao.trim(),
      responsavel: responsavel.trim(),
      status: 'aberta',
      prioridade,
      dataCriacao: new Date(),
      dataPrevista: dataPrevista ? new Date(dataPrevista) : null,
      dataConclusao: null,
      observacoes: observacoes.trim(),
    };

    onAddOrder(order);
    toast.success(`Ordem de Serviço ${order.numero} criada com sucesso!`);
    resetForm();
  };

  const handleStatusChange = (orderId: string, newStatus: ServiceOrderStatus) => {
    const changes: Partial<ServiceOrder> = { status: newStatus };
    if (newStatus === 'concluida') {
      changes.dataConclusao = new Date();
    } else {
      changes.dataConclusao = null;
    }
    onUpdateOrder(orderId, changes);
    toast.success(`Status atualizado para "${STATUS_LABELS[newStatus]}"`);
  };

  const handleDelete = (orderId: string, numero: string) => {
    onDeleteOrder(orderId);
    toast.success(`OS ${numero} removida`);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Ordens de Serviço (OS)
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowForm(prev => !prev)}
            variant={showForm ? 'outline' : 'default'}
          >
            <Plus className="h-4 w-4 mr-1" />
            {showForm ? 'Cancelar' : 'Nova OS'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          <div className="rounded border border-border p-2">
            <p className="text-muted-foreground">Total</p>
            <p className="font-semibold">{stats.total}</p>
          </div>
          <div className="rounded border border-border p-2">
            <p className="text-muted-foreground">Abertas</p>
            <p className="font-semibold text-blue-700">{stats.abertas}</p>
          </div>
          <div className="rounded border border-border p-2">
            <p className="text-muted-foreground">Em Andamento</p>
            <p className="font-semibold text-yellow-700">{stats.emAndamento}</p>
          </div>
          <div className="rounded border border-border p-2">
            <p className="text-muted-foreground">Concluídas</p>
            <p className="font-semibold text-green-700">{stats.concluidas}</p>
          </div>
          <div className="rounded border border-border p-2">
            <p className="text-muted-foreground">Canceladas</p>
            <p className="font-semibold text-gray-500">{stats.canceladas}</p>
          </div>
        </div>

        {/* New OS Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border border-border p-4 bg-muted/20 space-y-4">
            <p className="font-semibold text-sm">Nova Ordem de Serviço</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Equipamento (TAG)" />
                </SelectTrigger>
                <SelectContent>
                  {sortedEquipment.map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.tag} — {eq.area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={tipoManutencao} onValueChange={setTipoManutencao} required>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Manutenção" />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_TYPES.map(t => (
                    <SelectItem key={t.id} value={t.label}>
                      {t.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="Corretiva">Corretiva (não programada)</SelectItem>
                  <SelectItem value="Inspeção">Inspeção</SelectItem>
                </SelectContent>
              </Select>

              <Select value={prioridade} onValueChange={v => setPrioridade(v as ServiceOrderPriority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>

              <Input
                value={responsavel}
                onChange={e => setResponsavel(e.target.value)}
                placeholder="Responsável"
              />

              <Input
                type="date"
                value={dataPrevista}
                onChange={e => setDataPrevista(e.target.value)}
                placeholder="Data Prevista"
              />
            </div>

            <Input
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descrição do serviço"
              required
            />

            <Textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Observações (opcional)"
              rows={2}
            />

            <div className="flex gap-2">
              <Button type="submit">Abrir OS</Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por número, TAG, área, responsável..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as ServiceOrderStatus | 'todas')}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="aberta">Abertas</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluida">Concluídas</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {orders.length === 0
                ? 'Nenhuma Ordem de Serviço cadastrada. Clique em "Nova OS" para criar.'
                : 'Nenhuma OS encontrada com os filtros selecionados.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                className="rounded-lg border border-border p-4 bg-card hover:bg-muted/20 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-sm text-primary">{order.numero}</span>
                    <Badge variant="outline" className="font-mono text-xs">{order.equipmentTag}</Badge>
                    <StatusBadge status={order.status} />
                    <PriorityBadge priority={order.prioridade} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={order.status}
                      onValueChange={v => handleStatusChange(order.id, v as ServiceOrderStatus)}
                    >
                      <SelectTrigger className="h-7 text-xs w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aberta">Aberta</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(order.id, order.numero)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-sm">
                  <p className="font-medium">{order.descricao}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Área: <span className="text-foreground">{order.area}</span></span>
                    <span>Tipo: <span className="text-foreground">{order.tipoManutencao}</span></span>
                    {order.responsavel && (
                      <span>Responsável: <span className="text-foreground">{order.responsavel}</span></span>
                    )}
                    <span>
                      Criada em:{' '}
                      <span className="text-foreground">
                        {format(order.dataCriacao, 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </span>
                    {order.dataPrevista && (
                      <span>
                        Prevista:{' '}
                        <span className="text-foreground">
                          {format(order.dataPrevista, 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </span>
                    )}
                    {order.dataConclusao && (
                      <span>
                        Concluída em:{' '}
                        <span className="text-green-700 font-medium">
                          {format(order.dataConclusao, 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </span>
                    )}
                  </div>
                  {order.observacoes && (
                    <p className="text-xs text-muted-foreground italic mt-1">{order.observacoes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
