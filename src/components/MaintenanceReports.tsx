import { Equipment } from '@/lib/validationSchemas';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import { Card } from '@/components/ui/card';
import {
  groupByArea,
  groupByStatus,
  calculateOverdueRate,
  findMostOverdueMaintenance,
} from '@/lib/maintenanceCalculations';
import { subDays, format } from 'date-fns';

interface ReportsProps {
  equipment: Equipment[];
}

/**
 * Componente de relatórios com múltiplos gráficos
 */
export function MaintenanceReports({ equipment }: ReportsProps) {
  const statusByCounts = groupByStatus(equipment);
  const byArea = groupByArea(equipment);
  const overdueRate = calculateOverdueRate(equipment);
  const mostOverdue = findMostOverdueMaintenance(equipment);

  // Status distribution
  const statusData = [
    { name: 'Em dia', value: statusByCounts.ok?.length || 0, color: '#10b981' },
    { name: 'Atenção', value: statusByCounts.warning?.length || 0, color: '#f59e0b' },
    { name: 'Crítico', value: statusByCounts.critical?.length || 0, color: '#ef4444' },
    { name: 'Atrasado', value: statusByCounts.overdue?.length || 0, color: '#dc2626' },
  ].filter(d => d.value > 0);

  // Equipment by area
  const areaData = Object.entries(byArea).map(([area, eqs]) => ({
    area,
    total: eqs.length,
    ok: eqs.filter(e => e.statusGeral === 'ok').length,
    warning: eqs.filter(e => e.statusGeral === 'warning').length,
    critical: eqs.filter(e => e.statusGeral === 'critical').length,
    overdue: eqs.filter(e => e.statusGeral === 'overdue').length,
  }));

  // Most overdue maintenance types
  const overdueData = mostOverdue.slice(0, 8).map(m => ({
    type: m.label,
    count: m.count,
  }));

  // Days remaining distribution
  const daysData: { days: string; count: number }[] = [];
  [-30, -20, -10, 0, 10, 20, 30, 60, 90].forEach(day => {
    const count = equipment.filter(e => {
      if (e.diasRestantesGeral === null) return false;
      const range = 10;
      return e.diasRestantesGeral >= day && e.diasRestantesGeral < day + range;
    }).length;
    if (count > 0) {
      daysData.push({
        days: `${day} a ${day + 9}`,
        count,
      });
    }
  });

  // Equipment scatter: elevation vs maintenance urgency
  const scatterData = equipment
    .filter(e => e.diasRestantesGeral !== null)
    .map(e => ({
      x: e.elevacao,
      y: e.diasRestantesGeral,
      name: e.tag,
      status: e.statusGeral,
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      case 'overdue':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total de Equipamentos</p>
          <p className="text-3xl font-bold text-gray-900">{equipment.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Taxa de Atraso</p>
          <p className="text-3xl font-bold text-red-600">{overdueRate.toFixed(1)}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Em Dia</p>
          <p className="text-3xl font-bold text-green-600">
            {statusByCounts.ok?.length || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Crítico/Atrasado</p>
          <p className="text-3xl font-bold text-red-600">
            {(statusByCounts.critical?.length || 0) + (statusByCounts.overdue?.length || 0)}
          </p>
        </Card>
      </div>

      {/* Status pie chart */}
      <Card className="p-4">
        <h3 className="font-semibold text-lg mb-4">Distribuição de Status</h3>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500">
            Sem dados disponíveis
          </div>
        )}
      </Card>

      {/* Equipment by area */}
      <Card className="p-4">
        <h3 className="font-semibold text-lg mb-4">Equipamentos por Área</h3>
        {areaData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ok" stackId="a" fill="#10b981" name="Em dia" />
              <Bar dataKey="warning" stackId="a" fill="#f59e0b" name="Atenção" />
              <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Crítico" />
              <Bar dataKey="overdue" stackId="a" fill="#dc2626" name="Atrasado" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500">
            Sem dados disponíveis
          </div>
        )}
      </Card>

      {/* Days remaining distribution */}
      <Card className="p-4">
        <h3 className="font-semibold text-lg mb-4">Distribuição de Dias até Manutenção</h3>
        {daysData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={daysData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="days" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500">
            Sem dados disponíveis
          </div>
        )}
      </Card>

      {/* Most overdue maintenance types */}
      <Card className="p-4">
        <h3 className="font-semibold text-lg mb-4">Tipos de Manutenção Mais Atrasados</h3>
        {overdueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={overdueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="type" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500">
            Sem dados atrasados
          </div>
        )}
      </Card>

      {/* Scatter: elevation vs days remaining */}
      {scatterData.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-lg mb-4">
            Elevação vs Dias para Próxima Manutenção
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" label={{ value: 'Elevação (m)', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'Dias Restantes', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border rounded shadow text-xs">
                        <p className="font-medium">{data.name}</p>
                        <p>Elevação: {data.x}m</p>
                        <p>Dias: {data.y}</p>
                        <p>Status: {data.status}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {['ok', 'warning', 'critical', 'overdue'].map(status => (
                <Scatter
                  key={status}
                  name={`${status.toUpperCase()}`}
                  data={scatterData.filter(d => d.status === status)}
                  fill={getStatusColor(status)}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Export options */}
      <Card className="p-4 bg-blue-50">
        <h3 className="font-semibold text-lg mb-2">Exportar Relatório</h3>
        <p className="text-sm text-gray-600 mb-4">
          Gere relatórios em PDF ou Excel para análise posterior
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm font-medium">
            📊 Exportar PDF
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm font-medium">
            📈 Exportar Excel
          </button>
        </div>
      </Card>
    </div>
  );
}
