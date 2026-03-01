import { Equipment } from '@/types/equipment';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Building2 } from 'lucide-react';

interface ElevationChartProps {
  equipment: Equipment[];
}

export function ElevationChart({ equipment }: ElevationChartProps) {
  const elevations = [...new Set(equipment.map(equipmentItem => equipmentItem.elevacao))].sort((a, b) => a - b);

  const data = elevations.map(elevation => {
    const equipmentsAtElevation = equipment.filter(equipmentItem => equipmentItem.elevacao === elevation);
    return {
      name: `${elevation}º`,
      'Em Dia': equipmentsAtElevation.filter(equipmentItem => equipmentItem.statusGeral === 'ok').length,
      'Atenção': equipmentsAtElevation.filter(equipmentItem => equipmentItem.statusGeral === 'warning').length,
      'Crítico': equipmentsAtElevation.filter(equipmentItem => equipmentItem.statusGeral === 'critical').length,
      'Atrasado': equipmentsAtElevation.filter(equipmentItem => equipmentItem.statusGeral === 'overdue').length,
      total: equipmentsAtElevation.length,
    };
  });

  return (
    <div className="industrial-card">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Equipamentos por Elevação</h3>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 22%)" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(220, 15%, 22%)' }}
            />
            <YAxis
              tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(220, 15%, 22%)' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220, 18%, 13%)',
                border: '1px solid hsl(220, 15%, 22%)',
                borderRadius: '8px',
                color: 'hsl(210, 20%, 95%)',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'hsl(215, 15%, 55%)' }}
            />
            <Bar dataKey="Em Dia" stackId="a" fill="hsl(145, 70%, 45%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Atenção" stackId="a" fill="hsl(45, 100%, 50%)" />
            <Bar dataKey="Crítico" stackId="a" fill="hsl(0, 85%, 55%)" />
            <Bar dataKey="Atrasado" stackId="a" fill="hsl(0, 100%, 40%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
