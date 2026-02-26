import { useMemo } from 'react';
import { Equipment } from '@/types/equipment';
import { buildAnalyticsDashboard } from '@/services/analyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface DashboardProps {
  equipment: Equipment[];
}

const trendIcons = {
  up: <TrendingUp className="h-3 w-3 text-green-500" />,
  down: <TrendingDown className="h-3 w-3 text-destructive" />,
  stable: <Minus className="h-3 w-3 text-muted-foreground" />,
};

const statusColors: Record<string, string> = {
  ok: 'bg-green-500/10 text-green-600 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  critical: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function Dashboard({ equipment }: DashboardProps) {
  const analytics = useMemo(() => buildAnalyticsDashboard(equipment), [equipment]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {analytics.kpis.map(kpi => (
          <Card key={kpi.label} className="industrial-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-2xl font-bold">
                  {kpi.value}{kpi.unit}
                </p>
                {kpi.trend && trendIcons[kpi.trend]}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance by Service */}
        <Card className="industrial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conformidade por Área</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.complianceByService} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="service" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Conformidade']}
                  contentStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="Conformidade %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trends */}
        <Card className="industrial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tendência (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.trends} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="completed" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Concluídas" />
                <Line type="monotone" dataKey="overdue" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Atrasadas" />
                <Line type="monotone" dataKey="scheduled" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Agendadas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Maintenances */}
      {analytics.upcomingMaintenances.length > 0 && (
        <Card className="industrial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximas Manutenções (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {analytics.upcomingMaintenances.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/40">
                    <div className="flex items-center gap-2">
                      {m.daysUntil <= 7 && <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0" />}
                      <div>
                        <p className="text-xs font-medium">{m.equipmentTag}</p>
                        <p className="text-[11px] text-muted-foreground">{m.maintenanceType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs">{m.dueDate}</p>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] h-4', m.daysUntil <= 7 ? statusColors.critical : statusColors.ok)}
                      >
                        {m.daysUntil}d
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
