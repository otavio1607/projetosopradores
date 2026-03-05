import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PaymentService, formatCurrency, calculateProcessingFee } from '@/services/paymentService';
import { ReconciliationSummary, ReconciliationEntry } from '@/types/licensing';
import { AlertCircle, CheckCircle, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';

interface ReconciliationPanelProps {
  userId: string;
}

function getPeriodRange(period: 'current_month' | 'last_month' | 'last_30_days'): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  if (period === 'current_month') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  }
  if (period === 'last_month') {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0),
    };
  }
  // last_30_days
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  return { start, end: now };
}

type PeriodKey = 'current_month' | 'last_month' | 'last_30_days';

const PERIOD_LABELS: Record<PeriodKey, string> = {
  current_month: 'Mês Atual',
  last_month: 'Mês Anterior',
  last_30_days: 'Últimos 30 Dias',
};

export function ReconciliationPanel({ userId }: ReconciliationPanelProps) {
  const [period, setPeriod] = useState<PeriodKey>('current_month');
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReconciliation();
  }, [loadReconciliation]);

  const loadReconciliation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { start, end } = getPeriodRange(period);
      const data = await PaymentService.getReconciliationData(userId, start, end);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar conciliação');
    } finally {
      setIsLoading(false);
    }
  }, [userId, period]);

  const statusBadge = (entry: ReconciliationEntry) => {
    if (entry.status === 'matched') {
      return <Badge className="bg-green-600">✓ Conferido</Badge>;
    }
    if (entry.status === 'discrepancy') {
      return <Badge variant="destructive">⚠ Divergência</Badge>;
    }
    return <Badge variant="secondary">⏳ Pendente</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Controles de período */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => (
          <Button
            key={key}
            variant={period === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(key)}
          >
            {PERIOD_LABELS[key]}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={loadReconciliation} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Carregando dados de conciliação...
          </CardContent>
        </Card>
      )}

      {!isLoading && summary && (
        <>
          {/* Resumo financeiro */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  <p className="text-xs text-gray-500">Total Bruto</p>
                </div>
                <p className="text-xl font-bold">{formatCurrency(summary.totalGross)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <p className="text-xs text-gray-500">Taxas</p>
                </div>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(summary.totalFees)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-gray-500">Líquido Recebido</p>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(summary.totalNet)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <p className="text-xs text-gray-500">Divergências</p>
                </div>
                <p
                  className={`text-xl font-bold ${
                    summary.totalDiscrepancy !== 0 ? 'text-orange-600' : 'text-gray-400'
                  }`}
                >
                  {formatCurrency(summary.totalDiscrepancy)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Taxa de conferência */}
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Conferência</CardTitle>
              <CardDescription>
                Percentual de pagamentos que batem com o extrato da operadora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      summary.matchRate >= 0.95
                        ? 'bg-green-500'
                        : summary.matchRate >= 0.8
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, summary.matchRate * 100).toFixed(1)}%` }}
                  />
                </div>
                <span className="font-bold text-lg w-16 text-right">
                  {(summary.matchRate * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento por transação */}
          {summary.entries.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Transação</CardTitle>
                <CardDescription>
                  Comparativo entre valor recebido no sistema e repasse da operadora (menos taxas)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.entries.map((entry) => (
                    <div
                      key={entry.paymentId}
                      className="flex items-center justify-between p-3 border rounded-lg text-sm"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-xs text-gray-500">
                          {new Date(entry.date).toLocaleDateString('pt-BR')} · {entry.provider} ·{' '}
                          {entry.paymentMethod}
                        </p>
                        <div className="flex gap-4">
                          <span>
                            Bruto:{' '}
                            <span className="font-semibold">{formatCurrency(entry.grossAmount)}</span>
                          </span>
                          <span>
                            Taxa:{' '}
                            <span className="text-red-600">{formatCurrency(entry.feeAmount)}</span>
                          </span>
                          <span>
                            Líquido:{' '}
                            <span className="text-green-600">{formatCurrency(entry.netAmount)}</span>
                          </span>
                        </div>
                        {entry.discrepancy !== 0 && (
                          <p className="text-orange-600 text-xs">
                            Divergência: {formatCurrency(entry.discrepancy)}
                          </p>
                        )}
                      </div>
                      {statusBadge(entry)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-gray-500">
                Nenhuma transação encontrada para o período selecionado.
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!isLoading && !summary && !error && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-gray-500">
            Nenhum dado de conciliação disponível.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
