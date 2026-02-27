import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PricingPlans } from '@/components/PricingPlans';
import { LicenseManager } from '@/components/LicenseManager';
import { SubscriptionPanel } from '@/components/SubscriptionPanel';
import { PaymentForm } from '@/components/PaymentForm';
import { ReconciliationPanel } from '@/components/ReconciliationPanel';
import { Plan, License } from '@/types/licensing';

interface BillingPageProps {
  userId: string;
  currentLicense?: License;
}

export function BillingPage({ userId, currentLicense }: BillingPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [license, setLicense] = useState<License | null>(currentLicense || null);

  return (
    <div className="space-y-8 py-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Planos e Pagamentos</h1>
        <p className="text-lg text-gray-600">
          Gerencie sua assinatura e licença do sistema
        </p>
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="license">Licença</TabsTrigger>
          <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          <TabsTrigger value="payment">Pagamento</TabsTrigger>
          <TabsTrigger value="reconciliation">Conciliação</TabsTrigger>
        </TabsList>

        {/* Tab: Planos */}
        <TabsContent value="plans">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Escolha seu Plano</CardTitle>
                <CardDescription>
                  Selecione o plano que melhor atende às suas necessidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingPlans
                  onSelectPlan={(plan) => {
                    setSelectedPlan(plan);
                  }}
                  highlightedPlan="pro"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Licença */}
        <TabsContent value="license">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Licença</CardTitle>
                <CardDescription>
                  Ative, valide ou renove sua licença do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LicenseManager
                  onLicenseValidated={(lic) => setLicense(lic)}
                  onError={(error) => console.error(error)}
                />
              </CardContent>
            </Card>

            {/* Informações sobre Licenças */}
            <Card>
              <CardHeader>
                <CardTitle>Como Obter uma Licença?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">1. Escolha um Plano</h4>
                  <p className="text-sm text-gray-600">
                    Acesse a aba "Planos" e selecione o plano que deseja
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">2. Realize o Pagamento</h4>
                  <p className="text-sm text-gray-600">
                    Complete o pagamento usando Pix, cartão ou transferência bancária
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">3. Receba sua Chave</h4>
                  <p className="text-sm text-gray-600">
                    Você receberá a chave de licença por email instantaneamente
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">4. Ative a Licença</h4>
                  <p className="text-sm text-gray-600">
                    Cole a chave acima para ativar sua licença
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Assinatura */}
        <TabsContent value="subscription">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sua Assinatura</CardTitle>
                <CardDescription>
                  Gerensie sua assinatura ativa, faturas e histórico de pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionPanel
                  userId={userId}
                  onSubscriptionChanged={() => {}}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Pagamento */}
        <TabsContent value="payment">
          <div className="space-y-6">
            {selectedPlan ? (
              <PaymentForm
                plan={selectedPlan}
                onSuccess={() => {
                  // Recarrega licença após pagamento bem-sucedido
                }}
                onError={(error) => console.error(error)}
              />
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600 mb-4">
                    Selecione um plano na aba "Planos" para continuar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Conciliação Financeira */}
        <TabsContent value="reconciliation">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conciliação Financeira</CardTitle>
                <CardDescription>
                  Confira se os pagamentos recebidos coincidem com o repasse da operadora (menos taxas)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReconciliationPanel userId={userId} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
