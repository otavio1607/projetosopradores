import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Plus, Trash2, Pencil } from 'lucide-react';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface LanceEntry {
  id: string;
  tag: string;
  description: string;
  nextMaintenance: Date | null;
}

const STORAGE_KEY = 'lancas-monitoramento';

function loadFromStorage(): LanceEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{
      id: string;
      tag: string;
      description: string;
      nextMaintenance: string | null;
    }>;
    return parsed.map(e => ({
      ...e,
      nextMaintenance: e.nextMaintenance ? new Date(e.nextMaintenance) : null,
    }));
  } catch {
    return [];
  }
}

function saveToStorage(entries: LanceEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getDaysRemaining(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatus(days: number | null): 'ok' | 'warning' | 'critical' | 'overdue' | 'pending' {
  if (days === null) return 'pending';
  if (days < 0) return 'overdue';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'ok';
}

interface DateCellProps {
  entry: LanceEntry;
  onDateChange: (id: string, date: Date | null) => void;
}

function DateCell({ entry, onDateChange }: DateCellProps) {
  const [open, setOpen] = useState(false);
  const days = getDaysRemaining(entry.nextMaintenance);
  const status = getStatus(days);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all hover:ring-2 hover:ring-primary/30',
            status === 'ok' && 'bg-status-ok/5 border-status-ok/20 text-status-ok',
            status === 'warning' && 'bg-status-warning/5 border-status-warning/20 text-status-warning',
            status === 'critical' && 'bg-status-critical/10 border-status-critical/30 text-status-critical',
            status === 'overdue' && 'bg-status-overdue/10 border-status-overdue/30 text-status-overdue animate-pulse',
            status === 'pending' && 'bg-muted/30 border-border text-muted-foreground'
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {entry.nextMaintenance
            ? entry.nextMaintenance.toLocaleDateString('pt-BR')
            : 'Definir data'}
          {entry.nextMaintenance && (
            <span className="ml-1 font-bold text-xs">
              {days !== null && days < 0
                ? `(${Math.abs(days)}d atrasado)`
                : `(${days}d)`}
            </span>
          )}
          <Pencil className="h-3 w-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <p className="text-sm font-medium">{entry.tag}</p>
          <p className="text-xs text-muted-foreground">Próxima troca de lança</p>
        </div>
        <Calendar
          mode="single"
          selected={entry.nextMaintenance ?? undefined}
          onSelect={(date) => {
            onDateChange(entry.id, date ?? null);
            setOpen(false);
          }}
          locale={ptBR}
          className="p-3 pointer-events-auto"
          initialFocus
        />
        {entry.nextMaintenance && (
          <div className="p-3 border-t">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                onDateChange(entry.id, null);
                setOpen(false);
              }}
            >
              Limpar data
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function LancasCard() {
  const [entries, setEntries] = useState<LanceEntry[]>(() => loadFromStorage());
  const [newTag, setNewTag] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    saveToStorage(entries);
  }, [entries]);

  const handleAdd = () => {
    const tag = newTag.trim();
    if (!tag) {
      toast.error('Informe a TAG da lança');
      return;
    }
    const entry: LanceEntry = {
      id: `lance-${Date.now()}`,
      tag,
      description: newDesc.trim(),
      nextMaintenance: null,
    };
    setEntries(prev => [...prev, entry]);
    setNewTag('');
    setNewDesc('');
    setShowForm(false);
    toast.success(`Lança ${tag} adicionada ao monitoramento`);
  };

  const handleRemove = (id: string) => {
    const entry = entries.find(e => e.id === id);
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success(`Lança ${entry?.tag ?? ''} removida do monitoramento`);
  };

  const handleDateChange = (id: string, date: Date | null) => {
    setEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, nextMaintenance: date } : e))
    );
    toast.success(
      date
        ? `Data atualizada para ${date.toLocaleDateString('pt-BR')}`
        : 'Data removida'
    );
  };

  return (
    <div className="industrial-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h2 className="text-lg font-semibold">Monitoramento de Lanças</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {entries.length} lança{entries.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => setShowForm(v => !v)}
        >
          <Plus className="h-4 w-4" />
          Adicionar Lança
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
          <p className="text-sm font-medium mb-3">Nova Lança</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="TAG (ex: SPD-101)"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              className="sm:w-40 bg-muted/50 border-border"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="flex-1 bg-muted/50 border-border"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Button size="sm" onClick={handleAdd} className="gap-1">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          Nenhuma lança cadastrada. Clique em &quot;Adicionar Lança&quot; para começar.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  TAG
                </th>
                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Descrição
                </th>
                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Próxima Troca de Lança
                </th>
                <th className="w-12 p-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr
                  key={entry.id}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <td className="p-3 font-mono font-semibold">{entry.tag}</td>
                  <td className="p-3 text-muted-foreground">
                    {entry.description || '-'}
                  </td>
                  <td className="p-3">
                    <DateCell entry={entry} onDateChange={handleDateChange} />
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(entry.id)}
                      title="Remover lança"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
