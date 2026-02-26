import { Flame, Download, Upload, RefreshCw, Archive, FileSpreadsheet, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onExport: () => void;
  onExportHistory: () => void;
  onImport: (file: File) => void;
  onRefresh: () => void;
  onGetExportData: () => Uint8Array;
  lastUpdate: Date;
}

export function Header({ onExport, onExportHistory, onImport, onRefresh, onGetExportData, lastUpdate }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    toast.success('Sessão encerrada');
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      
      // Add the dynamically generated Excel
      const excelData = onGetExportData();
      zip.file('Sopradores_Manutencao_PowerBI.xlsx', excelData);

      // Fetch static files
      const [csvRes, readmeRes, xlsxRes] = await Promise.all([
        fetch('/downloads/PowerBI_Data.csv'),
        fetch('/downloads/README.md'),
        fetch('/downloads/Sopradores_Manutencao_2026-01-31.xlsx'),
      ]);

      if (csvRes.ok) zip.file('PowerBI_Data.csv', await csvRes.blob());
      if (readmeRes.ok) zip.file('README.md', await readmeRes.blob());
      if (xlsxRes.ok) zip.file('Sopradores_Manutencao_Original.xlsx', await xlsxRes.blob());

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sopradores_Completo_${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('ZIP gerado com sucesso!');
    } catch (error) {
      console.error('Error generating ZIP:', error);
      toast.error('Erro ao gerar ZIP');
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Flame className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Gestão de Sopradores de Fuligem
              </h1>
              <p className="text-sm text-muted-foreground">
                Sistema de Controle de Manutenção Preventiva
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground mr-2">
              Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Importar
                </span>
              </Button>
            </label>
            
            <Button
              variant="default"
              size="sm"
              onClick={onExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar Power BI
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onExportHistory}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Histórico CSV
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadZip}
              className="gap-2 bg-status-ok hover:bg-status-ok/80"
            >
              <Archive className="h-4 w-4" />
              Download ZIP
            </Button>

            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {user?.email?.split('@')[0]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-1 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
