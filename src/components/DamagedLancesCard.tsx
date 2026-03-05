import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { toast } from 'sonner';

export interface DamagedLance {
  id: string;
  tag: string;
  area: string;
  andar: number;
  altura: number;
  motivo: string;
}

interface DamagedLancesCardProps {
  equipment: Equipment[];
  damagedLances: DamagedLance[];
  onAddDamagedLance: (lance: DamagedLance) => void;
  onDeleteDamagedLance: (lanceId: string) => void;
}

export function DamagedLancesCard({
  equipment,
  damagedLances,
  onAddDamagedLance,
  onDeleteDamagedLance,
}: DamagedLancesCardProps) {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [manualTag, setManualTag] = useState('');
  const [manualArea, setManualArea] = useState('');
  const [manualAndar, setManualAndar] = useState('0');
  const [manualAltura, setManualAltura] = useState('0');
  const [motivo, setMotivo] = useState('');
  const [useExisting, setUseExisting] = useState(true);

  const handleEquipmentSelect = (id: string) => {
    setSelectedEquipmentId(id);
    const eq = equipment.find(e => e.id === id);
    if (eq) {
      setManualTag(eq.tag);
      setManualArea(eq.area);
      setManualAndar(String(eq.elevacao));
      setManualAltura(String(eq.altura));
    }
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const tag = manualTag.trim().toUpperCase();
    if (!tag) return;

    const andar = Number(manualAndar);
    const altura = Number(manualAltura);
    if (Number.isNaN(andar) || Number.isNaN(altura)) {
      toast.error('Andar e Altura devem ser valores numéricos válidos.');
      return;
    }

    onAddDamagedLance({
      id: crypto.randomUUID(),
      tag,
      area: manualArea.trim(),
      andar,
      altura,
      motivo: motivo.trim(),
    });

    setSelectedEquipmentId('');
    setManualTag('');
    setManualArea('');
    setManualAndar('0');
    setManualAltura('0');
    setMotivo('');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-status-overdue" />
          Lanças Danificadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/20">
          <ShieldAlert className="h-4 w-4 text-status-overdue" />
          <span className="text-sm font-medium">
            Total de lanças danificadas:
          </span>
          <Badge variant="destructive">{damagedLances.length}</Badge>
        </div>

        {/* Current damaged lances list */}
        {damagedLances.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Lanças registradas como danificadas:</p>
            <div className="grid gap-2">
              {damagedLances.map(lance => (
                <div
                  key={lance.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 bg-background"
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold">{lance.tag}</span>
                    {lance.area && <span className="text-muted-foreground">• {lance.area}</span>}
                    <span className="text-muted-foreground">• Andar {lance.andar}</span>
                    <span className="text-muted-foreground">• {lance.altura}m</span>
                    {lance.motivo && (
                      <Badge variant="outline" className="text-xs">
                        {lance.motivo}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => onDeleteDamagedLance(lance.id)}
                    aria-label={`Remover ${lance.tag} das lanças danificadas`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add form */}
        <form onSubmit={handleAdd} className="space-y-4">
          <p className="text-sm font-semibold">Adicionar lança danificada</p>

          <div className="flex gap-2 mb-2">
            <Button
              type="button"
              size="sm"
              variant={useExisting ? 'default' : 'outline'}
              onClick={() => setUseExisting(true)}
            >
              Selecionar da lista
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!useExisting ? 'default' : 'outline'}
              onClick={() => setUseExisting(false)}
            >
              Inserir manualmente
            </Button>
          </div>

          {useExisting && (
            <Select value={selectedEquipmentId} onValueChange={handleEquipmentSelect}>
              <SelectTrigger className="w-full sm:w-[380px]">
                <SelectValue placeholder="Selecione o equipamento" />
              </SelectTrigger>
              <SelectContent>
                {[...equipment]
                  .sort((a, b) => a.tag.localeCompare(b.tag))
                  .map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.tag} • {eq.area} • Andar {eq.elevacao} • {eq.altura}m
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input
              value={manualTag}
              onChange={e => setManualTag(e.target.value)}
              placeholder="TAG (ex: SPD-999)"
              required
              readOnly={useExisting && !!selectedEquipmentId}
            />
            <Input
              value={manualArea}
              onChange={e => setManualArea(e.target.value)}
              placeholder="Área"
              readOnly={useExisting && !!selectedEquipmentId}
            />
            <Input
              type="number"
              value={manualAndar}
              onChange={e => setManualAndar(e.target.value)}
              placeholder="Andar (Elevação)"
              min={0}
              step={1}
              readOnly={useExisting && !!selectedEquipmentId}
            />
            <Input
              type="number"
              value={manualAltura}
              onChange={e => setManualAltura(e.target.value)}
              placeholder="Altura (m)"
              min={0}
              step="0.1"
              readOnly={useExisting && !!selectedEquipmentId}
            />
            <Input
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Motivo / Observação"
            />
          </div>

          <Button type="submit" disabled={!manualTag.trim()}>
            Adicionar Lança Danificada
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
