import { useState, useEffect, useCallback } from 'react';
import { Equipment, MaintenanceStats, StatusFilter, MaintenanceTypeId, MAINTENANCE_TYPES } from '@/types/equipment';
import { loadDefaultData, parseExcelFile, calculateStats, exportToPowerBI, exportToPowerBIData, exportHistoryCSV } from '@/utils/excelParser';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { EquipmentTable } from '@/components/EquipmentTable';
import { MaintenanceCalendar } from '@/components/MaintenanceCalendar';
import { MaintenanceTimeline } from '@/components/MaintenanceTimeline';
import { ElevationChart } from '@/components/ElevationChart';
import { useMaintenanceSync } from '@/hooks/useMaintenanceSync';
import { 
  Gauge, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  XCircle,
  Loader2,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

function calculateDaysRemaining(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatus(daysRemaining: number | null): 'ok' | 'warning' | 'critical' | 'overdue' | 'pending' {
  if (daysRemaining === null) return 'pending';
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 30) return 'warning';
  return 'ok';
}

function getOverallStatus(manutencoes: Equipment['manutencoes']): 'ok' | 'warning' | 'critical' | 'overdue' {
  const hasOverdue = manutencoes.some(m => m.status === 'overdue');
  if (hasOverdue) return 'overdue';
  const hasCritical = manutencoes.some(m => m.status === 'critical');
  if (hasCritical) return 'critical';
  const hasWarning = manutencoes.some(m => m.status === 'warning');
  if (hasWarning) return 'warning';
  return 'ok';
}

function deriveEquipmentTotals(manutencoes: Equipment['manutencoes']) {
  const validManutencoes = manutencoes.filter(m => m.proximaManutencao !== null);
  const proximaManutencaoGeral = validManutencoes.length > 0
    ? validManutencoes.reduce((min, m) =>
        !min || (m.proximaManutencao && m.proximaManutencao < min) ? m.proximaManutencao : min,
        null as Date | null
      )
    : null;
  const diasRestantesGeral = validManutencoes.length > 0
    ? validManutencoes.reduce((min, m) =>
        m.diasRestantes !== null && (min === null || m.diasRestantes < min) ? m.diasRestantes : min,
        null as number | null
      )
    : null;
  return { proximaManutencaoGeral, diasRestantesGeral };
}

export default function Index() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [stats, setStats] = useState<MaintenanceStats>({
    total: 0,
    emDia: 0,
    atencao: 0,
    critico: 0,
    atrasado: 0,
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const { loadSavedRecords, saveRecord } = useMaintenanceSync();

  const applySavedRecords = useCallback((
    baseData: Equipment[],
    saved: { equipment_tag: string; type_id: string; ultima_manutencao: string | null; proxima_manutencao: string | null }[]
  ): Equipment[] => {
    if (saved.length === 0) return baseData;
    return baseData.map(equip => {
      const updatedManutencoes = equip.manutencoes.map(m => {
        const record = saved.find(
          r => r.equipment_tag === equip.tag && r.type_id === m.typeId
        );
        if (!record) return m;
        const proximaManutencao = record.proxima_manutencao
          ? new Date(record.proxima_manutencao + 'T00:00:00')
          : null;
        const ultimaManutencao = record.ultima_manutencao
          ? new Date(record.ultima_manutencao + 'T00:00:00')
          : null;
        const diasRestantes = calculateDaysRemaining(proximaManutencao);
        return {
          ...m,
          proximaManutencao,
          ultimaManutencao,
          diasRestantes,
          status: getStatus(diasRestantes),
        };
      });
      const { proximaManutencaoGeral, diasRestantesGeral } = deriveEquipmentTotals(updatedManutencoes);
      return {
        ...equip,
        manutencoes: updatedManutencoes,
        statusGeral: getOverallStatus(updatedManutencoes),
        proximaManutencaoGeral,
        diasRestantesGeral,
      };
    });
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [data, saved] = await Promise.all([loadDefaultData(), loadSavedRecords()]);
      const merged = applySavedRecords(data, saved);
      setEquipment(merged);
      setStats(calculateStats(merged));
      setLastUpdate(new Date());
      toast.success('Dados carregados com sucesso!');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImport = async (file: File) => {
    setIsLoading(true);
    try {
      const [data, saved] = await Promise.all([parseExcelFile(file), loadSavedRecords()]);
      const merged = applySavedRecords(data, saved);
      setEquipment(merged);
      setStats(calculateStats(merged));
      setLastUpdate(new Date());
      toast.success(`${merged.length} equipamentos importados com sucesso!`);
    } catch (error) {
      console.error('Error importing file:', error);
      toast.error('Erro ao importar arquivo. Verifique o formato.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    try {
      exportToPowerBI(equipment);
      toast.success('Arquivo exportado para Power BI!');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Erro ao exportar arquivo');
    }
  };

  const handleExportHistory = () => {
    try {
      exportHistoryCSV(equipment);
      toast.success('CSV de histórico exportado!');
    } catch (error) {
      console.error('Error exporting history:', error);
      toast.error('Erro ao exportar histórico');
    }
  };

  const handleFilterClick = (filter: StatusFilter) => {
    setStatusFilter(current => current === filter ? 'all' : filter);
  };

  const handleMaintenanceDateChange = useCallback((
    equipmentId: string, 
    typeId: MaintenanceTypeId, 
    newDate: Date | null
  ) => {
    let equipmentTag = '';
    let ultimaManutencao: Date | null = null;

    setEquipment(prevEquipment => {
      const updatedEquipment = prevEquipment.map(equip => {
        if (equip.id !== equipmentId) return equip;

        equipmentTag = equip.tag;

        // Update the specific maintenance record
        const updatedManutencoes = equip.manutencoes.map(m => {
          if (m.typeId !== typeId) return m;
          
          ultimaManutencao = m.ultimaManutencao;
          const diasRestantes = calculateDaysRemaining(newDate);
          return {
            ...m,
            proximaManutencao: newDate,
            diasRestantes,
            status: getStatus(diasRestantes),
          };
        });

        // Recalculate overall status
        const { proximaManutencaoGeral, diasRestantesGeral } = deriveEquipmentTotals(updatedManutencoes);

        return {
          ...equip,
          manutencoes: updatedManutencoes,
          statusGeral: getOverallStatus(updatedManutencoes),
          proximaManutencaoGeral,
          diasRestantesGeral,
        };
      });

      // Recalculate stats
      setStats(calculateStats(updatedEquipment));
      setLastUpdate(new Date());
      
      return updatedEquipment;
    });

    // Persist to Supabase
    if (equipmentTag) {
      saveRecord(equipmentTag, typeId, newDate, ultimaManutencao);
    }

    toast.success(newDate 
      ? `Data atualizada para ${newDate.toLocaleDateString('pt-BR')}` 
      : 'Data removida'
    );
  }, [saveRecord]);

  const handleMaintenanceComplete = useCallback((
    equipmentId: string,
    typeId: MaintenanceTypeId
  ) => {
    const maintenanceType = MAINTENANCE_TYPES.find(t => t.id === typeId);
    if (!maintenanceType) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + maintenanceType.interval);

    // Find the equipment tag for persistence
    const equip = equipment.find(e => e.id === equipmentId);

    setEquipment(prevEquipment => {
      const updatedEquipment = prevEquipment.map(e => {
        if (e.id !== equipmentId) return e;
        const updatedManutencoes = e.manutencoes.map(m => {
          if (m.typeId !== typeId) return m;
          const diasRestantes = calculateDaysRemaining(nextDate);
          return {
            ...m,
            ultimaManutencao: today,
            proximaManutencao: nextDate,
            diasRestantes,
            status: getStatus(diasRestantes),
          };
        });
        const { proximaManutencaoGeral, diasRestantesGeral } = deriveEquipmentTotals(updatedManutencoes);
        return {
          ...e,
          manutencoes: updatedManutencoes,
          statusGeral: getOverallStatus(updatedManutencoes),
          proximaManutencaoGeral,
          diasRestantesGeral,
        };
      });
      setStats(calculateStats(updatedEquipment));
      setLastUpdate(new Date());
      return updatedEquipment;
    });

    // Persist to Supabase with updated ultimaManutencao
    if (equip) {
      saveRecord(equip.tag, typeId, nextDate, today);
    }

    toast.success(`Manutenção "${maintenanceType.label}" concluída! Próxima em ${maintenanceType.periodicidade} (${nextDate.toLocaleDateString('pt-BR')})`);
  }, [equipment, saveRecord]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        onExport={handleExport}
        onExportHistory={handleExportHistory}
        onImport={handleImport}
        onRefresh={loadData}
        onGetExportData={() => exportToPowerBIData(equipment)}
        lastUpdate={lastUpdate}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total"
            value={stats.total}
            icon={<Gauge className="h-5 w-5" />}
            variant="primary"
            subtitle="equipamentos"
            onClick={() => handleFilterClick('all')}
            isActive={statusFilter === 'all'}
          />
          <StatCard
            title="Em Dia"
            value={stats.emDia}
            icon={<CheckCircle2 className="h-5 w-5" />}
            variant="success"
            subtitle="> 30 dias"
            onClick={() => handleFilterClick('ok')}
            isActive={statusFilter === 'ok'}
          />
          <StatCard
            title="Atenção"
            value={stats.atencao}
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="warning"
            subtitle="8-30 dias"
            onClick={() => handleFilterClick('warning')}
            isActive={statusFilter === 'warning'}
          />
          <StatCard
            title="Crítico"
            value={stats.critico}
            icon={<AlertCircle className="h-5 w-5" />}
            variant="danger"
            subtitle="≤ 7 dias"
            onClick={() => handleFilterClick('critical')}
            isActive={statusFilter === 'critical'}
          />
          <StatCard
            title="Atrasado"
            value={stats.atrasado}
            icon={<XCircle className="h-5 w-5" />}
            variant="critical"
            subtitle="vencido"
            onClick={() => handleFilterClick('overdue')}
            isActive={statusFilter === 'overdue'}
          />
        </div>

        {/* Elevation Chart */}
        <div className="mb-6">
          <ElevationChart equipment={equipment} />
        </div>

        {/* Timeline */}
        <div className="mb-6">
          <MaintenanceTimeline equipment={equipment} />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Table - 2 columns */}
          <div className="lg:col-span-2">
            <EquipmentTable 
              equipment={equipment} 
              statusFilter={statusFilter}
              onMaintenanceDateChange={handleMaintenanceDateChange}
              onMaintenanceComplete={handleMaintenanceComplete}
            />
          </div>

          {/* Calendar - 1 column */}
          <div className="lg:col-span-1">
            <MaintenanceCalendar equipment={equipment} />
          </div>
        </div>

        {/* Download Section */}
        <div className="mt-8 industrial-card">
          <div className="flex items-center gap-2 mb-4">
            <Download className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Arquivos para Download</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <a
              href="/downloads/Sopradores_Manutencao_2026-01-31.xlsx"
              download
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="w-10 h-10 rounded bg-status-ok/20 flex items-center justify-center text-status-ok font-bold text-xs">
                XLS
              </div>
              <div>
                <div className="text-sm font-medium">Planilha Excel</div>
                <div className="text-xs text-muted-foreground">Dados completos</div>
              </div>
            </a>
            <a
              href="/downloads/PowerBI_Data.csv"
              download
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="w-10 h-10 rounded bg-status-warning/20 flex items-center justify-center text-status-warning font-bold text-xs">
                CSV
              </div>
              <div>
                <div className="text-sm font-medium">Power BI</div>
                <div className="text-xs text-muted-foreground">Formato CSV</div>
              </div>
            </a>
            <a
              href="/downloads/README.md"
              download
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                MD
              </div>
              <div>
                <div className="text-sm font-medium">VS Code</div>
                <div className="text-xs text-muted-foreground">README + instruções</div>
              </div>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Sistema de Gestão de Manutenção de Sopradores de Fuligem</p>
          <p className="mt-1">
            Compatível com Power BI • Exportação em formato XLSX
          </p>
        </div>
      </footer>
    </div>
  );
}
