import { useMemo, useState } from 'react';
import { Equipment, MAINTENANCE_TYPES } from '@/types/equipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface EquipmentManagerCardProps {
  equipment: Equipment[];
  onAddEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: (equipmentId: string) => void;
}

export function EquipmentManagerCard({
  equipment,
  onAddEquipment,
  onDeleteEquipment,
}: EquipmentManagerCardProps) {
  const [tag, setTag] = useState('');
  const [area, setArea] = useState('');
  const [tipo, setTipo] = useState('Rotativo');
  const [elevacao, setElevacao] = useState('0');
  const [altura, setAltura] = useState('0');
  const [descricao, setDescricao] = useState('');
  const [selectedDeleteId, setSelectedDeleteId] = useState<string>('');

  const sortedEquipment = useMemo(
    () => [...equipment].sort((a, b) => a.tag.localeCompare(b.tag)),
    [equipment]
  );

  const lancaOverview = useMemo(() => {
    const lancas = equipment
      .map(eq => ({
        equipmentId: eq.id,
        tag: eq.tag,
        area: eq.area,
        maintenance: eq.manutencoes.find(m => m.typeId === 'troca_lanca') || null,
      }))
      .filter(item => item.maintenance !== null);

    const total = lancas.length;
    const overdue = lancas.filter(item => item.maintenance?.status === 'overdue').length;
    const critical = lancas.filter(item => item.maintenance?.status === 'critical').length;
    const warning = lancas.filter(item => item.maintenance?.status === 'warning').length;
    const ok = lancas.filter(item => item.maintenance?.status === 'ok').length;

    const urgent = lancas
      .filter(
        item =>
          item.maintenance?.status === 'overdue' ||
          item.maintenance?.status === 'critical'
      )
      .sort((a, b) => {
        const aDays = a.maintenance?.diasRestantes ?? 9999;
        const bDays = b.maintenance?.diasRestantes ?? 9999;
        return aDays - bDays;
      })
      .slice(0, 6);

    return { total, overdue, critical, warning, ok, urgent };
  }, [equipment]);

  const resetForm = () => {
    setTag('');
    setArea('');
    setTipo('Rotativo');
    setElevacao('0');
    setAltura('0');
    setDescricao('');
  };

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTag = tag.trim().toUpperCase();
    if (!normalizedTag || !area.trim()) {
      return;
    }

    const exists = equipment.some(eq => eq.tag.toUpperCase() === normalizedTag);
    if (exists) {
      return;
    }

    const elevacaoNumber = Number(elevacao);
    const alturaNumber = Number(altura);

    if (Number.isNaN(elevacaoNumber) || Number.isNaN(alturaNumber)) {
      return;
    }

    const newEquipment: Equipment = {
      id: crypto.randomUUID(),
      tag: normalizedTag,
      area: area.trim(),
      tipo,
      elevacao: elevacaoNumber,
      altura: alturaNumber,
      descricao: descricao.trim(),
      manutencoes: MAINTENANCE_TYPES.map(type => ({
        typeId: type.id,
        label: type.label,
        periodicidade: type.periodicidade,
        ultimaManutencao: null,
        proximaManutencao: null,
        diasRestantes: null,
        status: 'pending',
      })),
      statusGeral: 'ok',
      proximaManutencaoGeral: null,
      diasRestantesGeral: null,
    };

    onAddEquipment(newEquipment);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedDeleteId) return;
    onDeleteEquipment(selectedDeleteId);
    setSelectedDeleteId('');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Monitoramento de Lanças + Gestão de Equipamentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-warning" />
            <p className="text-sm font-semibold">Monitoramento de Troca de Lança</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            <div className="rounded border border-border p-2">
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold">{lancaOverview.total}</p>
            </div>
            <div className="rounded border border-border p-2">
              <p className="text-muted-foreground">Atrasadas</p>
              <p className="font-semibold text-status-overdue">{lancaOverview.overdue}</p>
            </div>
            <div className="rounded border border-border p-2">
              <p className="text-muted-foreground">Críticas</p>
              <p className="font-semibold text-status-critical">{lancaOverview.critical}</p>
            </div>
            <div className="rounded border border-border p-2">
              <p className="text-muted-foreground">Atenção</p>
              <p className="font-semibold text-status-warning">{lancaOverview.warning}</p>
            </div>
            <div className="rounded border border-border p-2">
              <p className="text-muted-foreground">Em dia</p>
              <p className="font-semibold text-status-ok">{lancaOverview.ok}</p>
            </div>
          </div>

          {lancaOverview.urgent.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lancaOverview.urgent.map(item => {
                const days = item.maintenance?.diasRestantes;
                const daysLabel =
                  days !== null && days !== undefined
                    ? days < 0
                      ? `${Math.abs(days)}d atrasado`
                      : `${days}d`
                    : 'sem data';

                return (
                  <Badge key={item.equipmentId} variant="outline">
                    {item.tag} • {daysLabel}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input
              value={tag}
              onChange={e => setTag(e.target.value)}
              placeholder="TAG (ex: SPD-999)"
              required
            />
            <Input
              value={area}
              onChange={e => setArea(e.target.value)}
              placeholder="Área"
              required
            />
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rotativo">Rotativo</SelectItem>
                <SelectItem value="Retrátil">Retrátil</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={elevacao}
              onChange={e => setElevacao(e.target.value)}
              placeholder="Elevação"
              min={0}
              step={1}
              required
            />
            <Input
              type="number"
              value={altura}
              onChange={e => setAltura(e.target.value)}
              placeholder="Altura"
              min={0}
              step="0.1"
              required
            />
            <Input
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descrição"
            />
          </div>
          <Button type="submit">Adicionar Equipamento</Button>
        </form>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Remover equipamento</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedDeleteId} onValueChange={setSelectedDeleteId}>
              <SelectTrigger className="w-full sm:w-[320px]">
                <SelectValue placeholder="Selecione a TAG para excluir" />
              </SelectTrigger>
              <SelectContent>
                {sortedEquipment.map(eq => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.tag} • {eq.area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={!selectedDeleteId}>
              Excluir Equipamento
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
