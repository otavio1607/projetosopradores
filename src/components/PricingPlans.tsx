import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { plans, paymentMethods } from '@/lib/paymentPlans';
import { Plan } from '@/types/licensing';

interface PricingPlansProps {
  onSelectPlan?: (plan: Plan) => void;
  highlightedPlan?: string;
  billingCycle?: 'monthly' | 'annual';
}

export function PricingPlans({
  onSelectPlan,
  highlightedPlan = 'pro',
  billingCycle = 'monthly',
}: PricingPlansProps) {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>(billingCycle);

  // Filtra planos pelo ciclo de faturamento
  const filteredPlans = plans.filter((p) => p.billingCycle === selectedCycle);

  return (
    <div className="space-y-8">
      {/* Seletor de ciclo de faturamento */}
      <div className="flex justify-center gap-4">
        <Button
          variant={selectedCycle === 'monthly' ? 'default' : 'outline'}
          onClick={() => setSelectedCycle('monthly')}
          className="min-w-[150px]"
        >
          Mensal
        </Button>
        <Button
          variant={selectedCycle === 'annual' ? 'default' : 'outline'}
          onClick={() => setSelectedCycle('annual')}
          className="min-w-[150px]"
        >
          Anual
          <Badge className="ml-2 bg-green-600">-20%</Badge>
        </Button>
      </div>

      {/* Grid de planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {filteredPlans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative transition-all ${
              plan.id === highlightedPlan
                ? 'ring-2 ring-blue-500 scale-105'
                : 'hover:shadow-lg'
            }`}
          >
            {plan.id === highlightedPlan && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500">Recomendado</Badge>
              </div>
            )}

            <CardHeader className="pb-4">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Preço */}
              <div className="space-y-1">
                <div className="text-4xl font-bold">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-sm text-gray-600">
                  {plan.billingCycle === 'monthly' ? 'por mês' : 'por ano'}
                </p>
              </div>

              {/* Botão de seleção */}
              <Button
                onClick={() => onSelectPlan?.(plan)}
                variant={plan.id === 'free' ? 'outline' : 'default'}
                className="w-full"
              >
                {plan.price === 0 ? 'Começar Grátis' : 'Escolher Plano'}
              </Button>

              {/* Features */}
              <div className="space-y-3 text-sm">
                {/* Limites principais */}
                <div className="border-t pt-3 space-y-2">
                  <FeatureItem
                    included={true}
                    text={`${plan.maxEquipment === 999 ? 'Ilimitado' : plan.maxEquipment} equipamentos`}
                  />
                  <FeatureItem
                    included={true}
                    text={`${plan.maxUsers === 99 ? 'Ilimitado' : plan.maxUsers} usuários`}
                  />
                  <FeatureItem
                    included={true}
                    text={`${plan.maxStorage}MB de storage`}
                  />
                  <FeatureItem
                    included={true}
                    text={`${plan.rateLimit} requisições/hora`}
                  />
                </div>

                {/* Recursos adicionais */}
                <div className="border-t pt-3 space-y-2">
                  {plan.advancedReports && (
                    <FeatureItem included={true} text="Relatórios avançados" />
                  )}
                  {plan.apiAccess && <FeatureItem included={true} text="Acesso API REST" />}
                  {plan.sso && <FeatureItem included={true} text="SSO/OAuth" />}
                  <FeatureItem
                    included={plan.support !== 'email'}
                    text={`Suporte ${plan.support === '24/7' ? '24/7' : 'prioritário'}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Métodos de pagamento aceitos */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Formas de Pagamento Aceitas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center gap-2 text-sm">
              <span className="text-2xl">{method.icon}</span>
              <div>
                <p className="font-medium">{method.name}</p>
                <p className="text-xs text-gray-600">{method.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs sobre planos */}
      <div className="bg-blue-50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold">Dúvidas sobre Planos?</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>Todos os planos incluem histórico de manutenção e exportação em Excel</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>Pode fazer upgrade/downgrade a qualquer momento</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>Teste o plano Pro grátis por 14 dias</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>Plano personalizado? Entre em contato conosco</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function FeatureItem({ included, text }: { included: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {included ? (
        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
      ) : (
        <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
      )}
      <span className={included ? 'text-gray-700' : 'text-gray-400'}>{text}</span>
    </div>
  );
}
