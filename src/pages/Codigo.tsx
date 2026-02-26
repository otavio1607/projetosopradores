import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ArrowLeft, Code2, FileCode2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

const SOURCE_FILES: CodeFile[] = [
  {
    name: 'equipment.ts',
    path: 'src/types/equipment.ts',
    language: 'typescript',
    description: 'Tipos e dados de equipamentos, mapeamento de elevações',
    content: `// Tipos de manutenção disponíveis e periodicidade
export const MAINTENANCE_TYPES = [
  { id: 'troca_cabos',          label: 'Troca de Cabos',           interval: 365,  periodicidade: 'Anual'     },
  { id: 'troca_redutor',        label: 'Troca de Redutor',         interval: 730,  periodicidade: '2 Anos'    },
  { id: 'troca_caixa_oca',      label: 'Troca de Caixa Oca',       interval: 1095, periodicidade: '3 Anos'    },
  { id: 'troca_esticador',      label: 'Troca de Esticador',       interval: 365,  periodicidade: 'Anual'     },
  { id: 'troca_corrente',       label: 'Troca de Corrente',        interval: 365,  periodicidade: 'Anual'     },
  { id: 'troca_embreagem',      label: 'Troca de Embreagem',       interval: 730,  periodicidade: '2 Anos'    },
  { id: 'troca_lanca',          label: 'Troca de Lança',           interval: 1095, periodicidade: '3 Anos'    },
  { id: 'troca_micro',          label: 'Troca de Micro',           interval: 180,  periodicidade: 'Semestral' },
  { id: 'limpeza_caixa_selagem',label: 'Limpeza Caixa de Selagem', interval: 30,   periodicidade: 'Mensal'    },
] as const;

export type MaintenanceTypeId = typeof MAINTENANCE_TYPES[number]['id'];

export interface MaintenanceRecord {
  typeId: MaintenanceTypeId;
  label: string;
  periodicidade: string;
  ultimaManutencao: Date | null;
  proximaManutencao: Date | null;
  diasRestantes: number | null;
  status: 'ok' | 'warning' | 'critical' | 'overdue' | 'pending';
}

export interface Equipment {
  id: string;
  tag: string;
  elevacao: number;
  altura: number;
  descricao: string;
  area: string;
  tipo: string;
  manutencoes: MaintenanceRecord[];
  statusGeral: 'ok' | 'warning' | 'critical' | 'overdue';
  proximaManutencaoGeral: Date | null;
  diasRestantesGeral: number | null;
}

export interface MaintenanceStats {
  total: number;
  emDia: number;
  atencao: number;
  critico: number;
  atrasado: number;
}

export type StatusFilter = 'all' | 'ok' | 'warning' | 'critical' | 'overdue';`,
  },
  {
    name: 'excelParser.ts',
    path: 'src/utils/excelParser.ts',
    language: 'typescript',
    description: 'Parser Excel, geração de dados de amostra, exportação Power BI e CSV',
    content: `import * as XLSX from 'xlsx';
import { Equipment, MaintenanceStats, MaintenanceRecord,
         MAINTENANCE_TYPES, MaintenanceTypeId } from '@/types/equipment';

// Calcula dias restantes até a próxima manutenção
function calculateDaysRemaining(nextMaintenance: Date | null): number | null {
  if (!nextMaintenance) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(nextMaintenance);
  next.setHours(0, 0, 0, 0);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Determina status com base nos dias restantes
function getStatus(days: number | null): 'ok' | 'warning' | 'critical' | 'overdue' | 'pending' {
  if (days === null) return 'pending';
  if (days < 0)  return 'overdue';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'ok';
}

// Carrega dados padrão do arquivo /data/equipamentos.xlsx
export async function loadDefaultData(): Promise<Equipment[]> {
  try {
    const response = await fetch('/data/equipamentos.xlsx');
    if (!response.ok) throw new Error('File not found');
    const arrayBuffer = await response.arrayBuffer();
    return parseExcelFile(arrayBuffer);
  } catch {
    return generateSampleData(); // fallback com dados de exemplo
  }
}

// Calcula estatísticas globais
export function calculateStats(equipment: Equipment[]): MaintenanceStats {
  return {
    total:    equipment.length,
    emDia:    equipment.filter(e => e.statusGeral === 'ok').length,
    atencao:  equipment.filter(e => e.statusGeral === 'warning').length,
    critico:  equipment.filter(e => e.statusGeral === 'critical').length,
    atrasado: equipment.filter(e => e.statusGeral === 'overdue').length,
  };
}

// Exporta dados para Power BI em formato .xlsx com 6 abas
export function exportToPowerBI(equipment: Equipment[]): void {
  const workbook = XLSX.utils.book_new();
  // Aba 1: Dados Principais, Aba 2: Resumo por Elevação,
  // Aba 3: Serviços por Tipo, Aba 4: Timeline, Aba 5: Por Área, Aba 6: Resumo
  // ... (ver código completo em src/utils/excelParser.ts)
  XLSX.writeFile(workbook, \`manutencao_sopradores_powerbi_\${new Date().toISOString().split('T')[0]}.xlsx\`);
}

// Exporta histórico completo em formato CSV (separado por ;)
export function exportHistoryCSV(equipment: Equipment[]): void {
  const BOM = '\\uFEFF';
  const headers = ['TAG','Área','Elevação','Altura (m)','Tipo',
                   'Tipo de Serviço','Periodicidade','Última Execução',
                   'Próxima Prevista','Dias Restantes','Status'];
  // ... monta linhas e faz download via URL.createObjectURL
}`,
  },
  {
    name: 'Index.tsx',
    path: 'src/pages/Index.tsx',
    language: 'tsx',
    description: 'Página principal — carregamento de dados, filtros, edição de manutenções',
    content: `import { useState, useEffect, useCallback } from 'react';
import { Equipment, MaintenanceStats, StatusFilter,
         MaintenanceTypeId, MAINTENANCE_TYPES } from '@/types/equipment';
import { loadDefaultData, calculateStats,
         exportToPowerBI, exportHistoryCSV } from '@/utils/excelParser';
import { Header }            from '@/components/Header';
import { StatCard }          from '@/components/StatCard';
import { EquipmentTable }    from '@/components/EquipmentTable';
import { MaintenanceCalendar }  from '@/components/MaintenanceCalendar';
import { MaintenanceTimeline }  from '@/components/MaintenanceTimeline';
import { ElevationChart }    from '@/components/ElevationChart';

export default function Index() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [stats, setStats]         = useState<MaintenanceStats>({ total:0, emDia:0, atencao:0, critico:0, atrasado:0 });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const data = await loadDefaultData();
    setEquipment(data);
    setStats(calculateStats(data));
    setIsLoading(false);
  };

  const handleMaintenanceDateChange = useCallback((
    equipmentId: string,
    typeId: MaintenanceTypeId,
    newDate: Date | null
  ) => {
    setEquipment(prev => {
      const updated = prev.map(equip => {
        if (equip.id !== equipmentId) return equip;
        const updatedManutencoes = equip.manutencoes.map(m => {
          if (m.typeId !== typeId) return m;
          const dias = newDate
            ? Math.ceil((newDate.getTime() - Date.now()) / 86400000)
            : null;
          return { ...m, proximaManutencao: newDate, diasRestantes: dias };
        });
        return { ...equip, manutencoes: updatedManutencoes };
      });
      setStats(calculateStats(updated));
      return updated;
    });
  }, []);

  return (
    <div className="min-h-screen">
      <Header onExport={...} onExportHistory={...} onImport={...} onRefresh={loadData} ... />
      <main className="container mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard title="Total"   value={stats.total}   ... />
          <StatCard title="Em Dia"  value={stats.emDia}   ... />
          <StatCard title="Atenção" value={stats.atencao} ... />
          <StatCard title="Crítico" value={stats.critico} ... />
          <StatCard title="Atrasado" value={stats.atrasado} ... />
        </div>
        <ElevationChart equipment={equipment} />
        <MaintenanceTimeline equipment={equipment} />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EquipmentTable equipment={equipment} statusFilter={statusFilter}
              onMaintenanceDateChange={handleMaintenanceDateChange} />
          </div>
          <div className="lg:col-span-1">
            <MaintenanceCalendar equipment={equipment} />
          </div>
        </div>
      </main>
    </div>
  );
}`,
  },
  {
    name: 'Header.tsx',
    path: 'src/components/Header.tsx',
    language: 'tsx',
    description: 'Barra de ações — importar, exportar Power BI, histórico CSV, download ZIP',
    content: `import { Flame, Download, Upload, RefreshCw, Archive, FileSpreadsheet, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import JSZip from 'jszip';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onExport: () => void;
  onExportHistory: () => void;
  onImport: (file: File) => void;
  onRefresh: () => void;
  onGetExportData: () => Uint8Array;
  lastUpdate: Date;
}

export function Header({ onExport, onExportHistory, onImport,
                         onRefresh, onGetExportData, lastUpdate }: HeaderProps) {
  const navigate = useNavigate();

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const excelData = onGetExportData();
    zip.file('Sopradores_Manutencao_PowerBI.xlsx', excelData);
    const [csvRes, readmeRes, xlsxRes] = await Promise.all([
      fetch('/downloads/PowerBI_Data.csv'),
      fetch('/downloads/README.md'),
      fetch('/downloads/Sopradores_Manutencao_2026-01-31.xlsx'),
    ]);
    if (csvRes.ok)    zip.file('PowerBI_Data.csv',                await csvRes.blob());
    if (readmeRes.ok) zip.file('README.md',                       await readmeRes.blob());
    if (xlsxRes.ok)   zip.file('Sopradores_Manutencao_Original.xlsx', await xlsxRes.blob());
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = \`Sopradores_Completo_\${new Date().toISOString().split('T')[0]}.zip\`;
    a.click();
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo + Título */}
          <div className="flex items-center gap-3">
            <Flame className="h-8 w-8 text-primary" />
            <h1>Gestão de Sopradores de Fuligem</h1>
          </div>
          {/* Ações */}
          <div className="flex items-center gap-2">
            <Button onClick={onRefresh}>Atualizar</Button>
            <Button onClick={onExport}>Exportar Power BI</Button>
            <Button onClick={onExportHistory}>Histórico CSV</Button>
            <Button onClick={handleDownloadZip}>Download ZIP</Button>
            <Button onClick={() => navigate('/codigo')}>
              <Code2 /> Código
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}`,
  },
];

export default function Codigo() {
  const navigate = useNavigate();
  const [activeFile, setActiveFile] = useState(SOURCE_FILES[0]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                <Flame className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Código-Fonte
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sistema de Gestão de Manutenção de Sopradores
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2"
              >
                <a
                  href="https://github.com/otavio1607/projetosopradores"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Intro */}
        <div className="mb-6 industrial-card">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Sobre o Projeto</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sistema web de controle de manutenção preventiva para{' '}
            <strong>177 sopradores de fuligem</strong>. Construído com{' '}
            <strong>React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Recharts · xlsx · JSZip</strong>.
            Permite importar/exportar planilhas Excel, visualizar status por calendário e elevação,
            e gerar relatórios prontos para o Power BI.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Licenciado sob a{' '}
            <a
              href="https://github.com/otavio1607/projetosopradores/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              MIT License
            </a>
            {' '}— © {new Date().getFullYear()} otavio1607
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* File list */}
          <div className="lg:col-span-1">
            <div className="industrial-card">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                Arquivos
              </h3>
              <ul className="space-y-1">
                {SOURCE_FILES.map(file => (
                  <li key={file.path}>
                    <button
                      onClick={() => setActiveFile(file)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                        activeFile.path === file.path
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <FileCode2 className="h-4 w-4 shrink-0" />
                      <div className="truncate">
                        <div className="font-medium truncate">{file.name}</div>
                        <div className="text-xs opacity-70 truncate">{file.path}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Code viewer */}
          <div className="lg:col-span-3">
            <div className="industrial-card h-full">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{activeFile.name}</h3>
                  <p className="text-xs text-muted-foreground">{activeFile.description}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-muted/40 text-muted-foreground font-mono">
                  {activeFile.language}
                </span>
              </div>
              <div className="rounded-lg bg-muted/30 border border-border overflow-auto max-h-[600px]">
                <pre className="p-4 text-xs leading-relaxed font-mono text-foreground/90 whitespace-pre">
                  <code>{activeFile.content}</code>
                </pre>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Este é um resumo do arquivo. Veja o código completo em{' '}
                <a
                  href={`https://github.com/otavio1607/projetosopradores/blob/main/${activeFile.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  github.com/otavio1607/projetosopradores
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Sistema de Gestão de Manutenção de Sopradores de Fuligem</p>
          <p className="mt-1">
            MIT License · © {new Date().getFullYear()} otavio1607 ·{' '}
            <a
              href="https://github.com/otavio1607/projetosopradores"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
