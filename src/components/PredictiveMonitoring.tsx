import { useMemo } from 'react';
import { Equipment, MAINTENANCE_TYPES } from '@/types/equipment';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Activity, Thermometer, Gauge, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PredictiveMonitoringProps {
  equipment: Equipment[];
}

interface SensorReading {
  date: string;
  temperature: number;
  pressure: number;
  vibration: number;
}

// Simulate 30 days of sensor readings with a trend towards anomaly
function generateSensorData(seed: number = 42): SensorReading[] {
  const data: SensorReading[] = [];
  const today = new Date();
  // Use deterministic pseudo-random based on seed
  let rng = seed;
  const rand = () => {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0xffffffff;
  };

  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const dayProgress = (29 - i) / 29; // 0 to 1 trend progression
    // Simulate gradual increase in temperature and pressure (predictive alert)
    const tempBase = 185 + dayProgress * 12;
    const pressBase = 4.2 + dayProgress * 0.6;
    const vibBase = 1.8 + dayProgress * 0.8;

    data.push({
      date: format(date, 'dd/MM', { locale: ptBR }),
      temperature: parseFloat((tempBase + (rand() - 0.5) * 4).toFixed(1)),
      pressure: parseFloat((pressBase + (rand() - 0.5) * 0.3).toFixed(2)),
      vibration: parseFloat((vibBase + (rand() - 0.5) * 0.4).toFixed(2)),
    });
  }
  return data;
}

// Calculate MTBF (Mean Time Between Failures) in days
function calculateMTBF(equipment: Equipment[]): number {
  if (equipment.length === 0) return 0;
  // Count equipment with overdue/critical maintenance as "failures"
  const failures = equipment.reduce((count, eq) => {
    return count + eq.manutencoes.filter(m => m.status === 'overdue').length;
  }, 0);
  if (failures === 0) return 9999; // No failures = very high MTBF
  // Estimate: total maintenance intervals / failures
  const totalIntervalDays = equipment.reduce((sum, eq) => {
    return sum + eq.manutencoes.reduce((s, m) => {
      const mt = MAINTENANCE_TYPES.find(t => t.id === m.typeId);
      return s + (mt ? mt.interval : 30);
    }, 0);
  }, 0);
  return Math.round(totalIntervalDays / Math.max(failures, 1));
}

// Calculate MTTR (Mean Time To Repair) in hours - estimated
function calculateMTTR(equipment: Equipment[]): number {
  const overdue = equipment.filter(eq =>
    eq.manutencoes.some(m => m.status === 'overdue')
  );
  if (overdue.length === 0) return 0;
  // Estimate repair time based on how overdue the maintenance is
  const totalOverdueDays = overdue.reduce((sum, eq) => {
    const maxOverdue = Math.min(...eq.manutencoes
      .filter(m => m.status === 'overdue' && m.diasRestantes !== null)
      .map(m => m.diasRestantes as number));
    return sum + Math.abs(Math.min(maxOverdue, 0));
  }, 0);
  // Average 4-8 hours per repair, scaled by overdue days
  return parseFloat(((totalOverdueDays / overdue.length) * 0.5 + 4).toFixed(1));
}

export function PredictiveMonitoring({ equipment }: PredictiveMonitoringProps) {
  const sensorData = useMemo(() => generateSensorData(42), []);
  const mtbf = useMemo(() => calculateMTBF(equipment), [equipment]);
  const mttr = useMemo(() => calculateMTTR(equipment), [equipment]);

  // Calculate availability: MTBF / (MTBF + MTTR) * 100
  const availability = mtbf === 9999 ? 99.9 : parseFloat(
    ((mtbf / (mtbf + mttr / 24)) * 100).toFixed(1)
  );

  // Identify trend anomalies (last 5 readings vs first 5)
  const lastReadings = sensorData.slice(-5);
  const firstReadings = sensorData.slice(0, 5);
  const avgTempRecent = lastReadings.reduce((s, r) => s + r.temperature, 0) / 5;
  const avgTempEarly = firstReadings.reduce((s, r) => s + r.temperature, 0) / 5;
  const tempTrend = avgTempRecent - avgTempEarly;
  const avgPressRecent = lastReadings.reduce((s, r) => s + r.pressure, 0) / 5;
  const avgPressEarly = firstReadings.reduce((s, r) => s + r.pressure, 0) / 5;
  const pressTrend = avgPressRecent - avgPressEarly;

  const tempAlert = avgTempRecent > 195;
  const pressAlert = avgPressRecent > 4.7;

  // Count equipment by status for reliability stats
  const overdueCount = equipment.filter(e => e.statusGeral === 'overdue').length;
  const criticalCount = equipment.filter(e => e.statusGeral === 'critical').length;

  const latestTemp = sensorData[sensorData.length - 1]?.temperature ?? 0;
  const latestPressure = sensorData[sensorData.length - 1]?.pressure ?? 0;
  const latestVibration = sensorData[sensorData.length - 1]?.vibration ?? 0;

  return (
    <div className="industrial-card space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Manutenção Preditiva e Confiabilidade</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-status-ok" />
            <span className="text-xs text-muted-foreground">MTBF</span>
          </div>
          <p className="text-2xl font-bold font-mono text-status-ok">
            {mtbf === 9999 ? '∞' : `${mtbf}d`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Tempo Médio Entre Falhas</p>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-status-warning" />
            <span className="text-xs text-muted-foreground">MTTR</span>
          </div>
          <p className="text-2xl font-bold font-mono text-status-warning">
            {mttr === 0 ? '—' : `${mttr}h`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Tempo Médio para Reparo</p>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-2 mb-1">
            <Gauge className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Disponibilidade</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${availability >= 95 ? 'text-status-ok' : availability >= 85 ? 'text-status-warning' : 'text-status-overdue'}`}>
            {availability}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Disponibilidade da linha</p>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-status-critical" />
            <span className="text-xs text-muted-foreground">Crítico/Atrasado</span>
          </div>
          <p className="text-2xl font-bold font-mono text-status-overdue">
            {overdueCount + criticalCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Equipamentos em risco</p>
        </Card>
      </div>

      {/* Trend Alerts */}
      {(tempAlert || pressAlert) && (
        <div className="flex flex-wrap gap-3">
          {tempAlert && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-overdue/10 border border-status-overdue/30 text-status-overdue text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Temperatura elevada: {latestTemp}°C (limite: 195°C)</span>
            </div>
          )}
          {pressAlert && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-critical/10 border border-status-critical/30 text-status-critical text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Pressão elevada: {latestPressure} bar (limite: 4.7 bar)</span>
            </div>
          )}
        </div>
      )}

      {/* Sensor Reading Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border p-3 bg-muted/10">
          <div className="flex items-center gap-2 mb-1">
            <Thermometer className={`h-4 w-4 ${tempAlert ? 'text-status-overdue' : 'text-status-ok'}`} />
            <span className="text-xs text-muted-foreground">Temperatura Atual</span>
            <Badge variant="outline" className={`ml-auto text-xs ${tempTrend > 5 ? 'text-status-overdue border-status-overdue/50' : 'text-status-ok border-status-ok/50'}`}>
              {tempTrend > 0 ? '+' : ''}{tempTrend.toFixed(1)}°C / 30d
            </Badge>
          </div>
          <p className={`text-xl font-bold font-mono ${tempAlert ? 'text-status-overdue' : 'text-foreground'}`}>
            {latestTemp}°C
          </p>
        </div>
        <div className="rounded-lg border border-border p-3 bg-muted/10">
          <div className="flex items-center gap-2 mb-1">
            <Gauge className={`h-4 w-4 ${pressAlert ? 'text-status-overdue' : 'text-status-ok'}`} />
            <span className="text-xs text-muted-foreground">Pressão Atual</span>
            <Badge variant="outline" className={`ml-auto text-xs ${pressTrend > 0.4 ? 'text-status-overdue border-status-overdue/50' : 'text-status-ok border-status-ok/50'}`}>
              {pressTrend > 0 ? '+' : ''}{pressTrend.toFixed(2)} bar / 30d
            </Badge>
          </div>
          <p className={`text-xl font-bold font-mono ${pressAlert ? 'text-status-overdue' : 'text-foreground'}`}>
            {latestPressure} bar
          </p>
        </div>
        <div className="rounded-lg border border-border p-3 bg-muted/10">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Vibração Atual</span>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {latestVibration} mm/s
          </p>
        </div>
      </div>

      {/* Temperature & Pressure Trend Chart */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
          Tendências de Temperatura e Pressão (últimos 30 dias)
        </h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensorData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 22%)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(220, 15%, 22%)' }}
                interval={4}
              />
              <YAxis
                yAxisId="temp"
                orientation="left"
                domain={[175, 210]}
                tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(220, 15%, 22%)' }}
                label={{ value: '°C', angle: -90, position: 'insideLeft', fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
              />
              <YAxis
                yAxisId="press"
                orientation="right"
                domain={[3.8, 5.2]}
                tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(220, 15%, 22%)' }}
                label={{ value: 'bar', angle: 90, position: 'insideRight', fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220, 18%, 13%)',
                  border: '1px solid hsl(220, 15%, 22%)',
                  borderRadius: '8px',
                  color: 'hsl(210, 20%, 95%)',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(215, 15%, 55%)' }} />
              {/* Alert thresholds */}
              <ReferenceLine yAxisId="temp" y={195} stroke="hsl(0, 100%, 42%)" strokeDasharray="4 4" label={{ value: 'Limite T°', fill: 'hsl(0, 100%, 42%)', fontSize: 10 }} />
              <ReferenceLine yAxisId="press" y={4.7} stroke="hsl(28, 95%, 56%)" strokeDasharray="4 4" label={{ value: 'Limite P', fill: 'hsl(28, 95%, 56%)', fontSize: 10 }} />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temperature"
                stroke="hsl(0, 85%, 60%)"
                strokeWidth={2}
                dot={false}
                name="Temperatura (°C)"
              />
              <Line
                yAxisId="press"
                type="monotone"
                dataKey="pressure"
                stroke="hsl(210, 100%, 55%)"
                strokeWidth={2}
                dot={false}
                name="Pressão (bar)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vibration Trend Chart */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
          Tendência de Vibração (últimos 30 dias)
        </h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensorData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 22%)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(220, 15%, 22%)' }}
                interval={4}
              />
              <YAxis
                domain={[0, 4]}
                tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(220, 15%, 22%)' }}
                label={{ value: 'mm/s', angle: -90, position: 'insideLeft', fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220, 18%, 13%)',
                  border: '1px solid hsl(220, 15%, 22%)',
                  borderRadius: '8px',
                  color: 'hsl(210, 20%, 95%)',
                  fontSize: 12,
                }}
              />
              <ReferenceLine y={3.0} stroke="hsl(45, 100%, 50%)" strokeDasharray="4 4" label={{ value: 'Atenção', fill: 'hsl(45, 100%, 50%)', fontSize: 10 }} />
              <ReferenceLine y={3.5} stroke="hsl(0, 100%, 42%)" strokeDasharray="4 4" label={{ value: 'Crítico', fill: 'hsl(0, 100%, 42%)', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="vibration"
                stroke="hsl(145, 70%, 45%)"
                strokeWidth={2}
                dot={false}
                name="Vibração (mm/s)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reliability Notes */}
      <div className="text-xs text-muted-foreground pt-2 border-t border-border space-y-1">
        <p>
          <strong className="text-foreground">MTBF</strong> (Tempo Médio Entre Falhas): calculado com base nas manutenções atrasadas como proxy de falha.
        </p>
        <p>
          <strong className="text-foreground">MTTR</strong> (Tempo Médio para Reparo): estimado com base no tempo de atraso médio das manutenções vencidas.
        </p>
        <p>
          <strong className="text-foreground">Sensores</strong>: dados simulados com tendência de aumento para demonstração do monitoramento preditivo.
          Conecte sensores reais via API para leituras em tempo real.
        </p>
      </div>
    </div>
  );
}
