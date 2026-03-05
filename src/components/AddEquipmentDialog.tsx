import { useState } from 'react';
import { Equipment, MAINTENANCE_TYPES, ELEVATION_DATA } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingAreas: string[];
  onAdd: (equipment: Equipment) => void;
}

const AREAS = ['Caldeira', 'Superaquecedor', 'Economizador', 'Ar Pré-Aquecido', 'Reaquecedor', 'Tubulão', 'Outros'];
const TIPOS = ['Rotativo', 'Retrátil'];

export function AddEquipmentDialog({ open, onOpenChange, existingAreas, onAdd }: AddEquipmentDialogProps) {
  const [tag, setTag] = useState('');
  const [area, setArea] = useState('');
  const [elevacao, setElevacao] = useState('');
  const [altura, setAltura] = useState('');
  const [tipo, setTipo] = useState('Rotativo');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allAreas = [...new Set([...AREAS, ...existingAreas])].sort();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!tag.trim()) newErrors.tag = 'TAG é obrigatória';
    if (!area) newErrors.area = 'Área é obrigatória';
    if (!elevacao || isNaN(Number(elevacao))) newErrors.elevacao = 'Elevação deve ser um número válido';
    if (!altura || isNaN(Number(altura))) newErrors.altura = 'Altura deve ser um número válido (ex: 1.5)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const manutencoes = MAINTENANCE_TYPES.map(type => ({
      typeId: type.id,
      label: type.label,
      periodicidade: type.periodicidade,
      ultimaManutencao: null,
      proximaManutencao: null,
      diasRestantes: null,
      status: 'pending' as const,
    }));

    const newEquipment: Equipment = {
      id: `equip-custom-${Date.now()}`,
      tag: tag.trim().toUpperCase(),
      elevacao: Number(elevacao),
      altura: Number(altura),
      descricao: `Soprador de Fuligem ${tipo}`,
      area,
      tipo,
      manutencoes,
      statusGeral: 'ok',
      proximaManutencaoGeral: null,
      diasRestantesGeral: null,
    };

    onAdd(newEquipment);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setTag('');
    setArea('');
    setElevacao('');
    setAltura('');
    setTipo('Rotativo');
    setErrors({});
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Equipamento</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="tag">TAG do Soprador</Label>
            <Input
              id="tag"
              placeholder="Ex: SPD-301"
              value={tag}
              onChange={e => setTag(e.target.value)}
              className={errors.tag ? 'border-destructive' : ''}
            />
            {errors.tag && <p className="text-xs text-destructive">{errors.tag}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="area">Área</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger id="area" className={errors.area ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione a área" />
              </SelectTrigger>
              <SelectContent>
                {allAreas.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.area && <p className="text-xs text-destructive">{errors.area}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="elevacao">Elevação (andar)</Label>
              <Input
                id="elevacao"
                type="number"
                placeholder="Ex: 14"
                value={elevacao}
                onChange={e => setElevacao(e.target.value)}
                className={errors.elevacao ? 'border-destructive' : ''}
              />
              {errors.elevacao && <p className="text-xs text-destructive">{errors.elevacao}</p>}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="altura">Altura (m)</Label>
              <Input
                id="altura"
                type="number"
                step="0.1"
                placeholder="Ex: 1.5"
                value={altura}
                onChange={e => setAltura(e.target.value)}
                className={errors.altura ? 'border-destructive' : ''}
              />
              {errors.altura && <p className="text-xs text-destructive">{errors.altura}</p>}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
