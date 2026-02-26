import { useMaintenanceHistory } from '@/hooks/useEquipment';
import { MaintenanceHistory } from '@/lib/validationSchemas';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MaintenanceHistoryProps {
  equipmentId: string;
}

/**
 * Componente que exibe o histórico completo de manutenções de um equipamento
 */
export function MaintenanceHistoryPanel({ equipmentId }: MaintenanceHistoryProps) {
  const { data: history = [], isLoading } = useMaintenanceHistory(equipmentId);

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Carregando histórico...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Clock size={32} className="mx-auto mb-2 text-gray-400" />
        Nenhum histórico de manutenção registrado
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg mb-4">Histórico de Manutenção</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {history.map(record => (
          <HistoryCard key={record.id} record={record} />
        ))}
      </div>
    </div>
  );
}

/**
 * Card individual de um registro de histórico
 */
function HistoryCard({ record }: { record: MaintenanceHistory }) {
  const getStatusIcon = (resultado?: string) => {
    switch (resultado) {
      case 'sucesso':
        return <CheckCircle2 className="text-green-500" size={20} />;
      case 'falho':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStatusBadge = (resultado?: string) => {
    switch (resultado) {
      case 'sucesso':
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'falho':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <Card className="p-4 border-l-4 border-blue-500 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon(record.resultado)}
          <div>
            <p className="font-medium text-gray-900">{record.maintenanceTypeId}</p>
            <p className="text-xs text-gray-500">
              {format(new Date(record.dataManutencao), 'dd MMM yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
        {getStatusBadge(record.resultado)}
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Realizado por:</span>
          <span className="font-medium text-gray-900">{record.realizadoPor}</span>
        </div>

        {record.dataProxima && (
          <div className="flex justify-between">
            <span className="text-gray-600">Próxima manutenção:</span>
            <span className="font-medium text-gray-900">
              {format(new Date(record.dataProxima), 'dd MMM yyyy', { locale: ptBR })}
            </span>
          </div>
        )}

        {record.notas && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-gray-700 border-l-2 border-gray-300">
            <p className="text-xs font-semibold text-gray-600 mb-1">Notas:</p>
            <p className="text-xs">{record.notas}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Timeline visual do histórico (últimos 6 meses)
 */
export function MaintenanceTimeline({ equipmentId }: MaintenanceHistoryProps) {
  const { data: history = [], isLoading } = useMaintenanceHistory(equipmentId);

  if (isLoading || history.length === 0) return null;

  // Filter last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentHistory = history.filter(h => new Date(h.dataManutencao) >= sixMonthsAgo);

  if (recentHistory.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Timeline dos Últimos 6 Meses</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Timeline items */}
        <div className="space-y-6 pl-16">
          {recentHistory.map((record, index) => (
            <div key={record.id} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-10 top-2 w-6 h-6 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center">
                {record.resultado === 'sucesso' && (
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                )}
              </div>

              {/* Content */}
              <div>
                <p className="font-medium text-gray-900">{record.maintenanceTypeId}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(record.dataManutencao), 'dd MMMM yyyy', { locale: ptBR })}
                  {' - '}
                  {record.realizadoPor}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
