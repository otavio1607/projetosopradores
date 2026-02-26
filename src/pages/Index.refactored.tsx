import { useState } from 'react';
import { useEquipmentList, useUnreadAlerts } from '@/hooks/useEquipment';
import { useAutoAlerts } from '@/hooks/useAutoAlerts';
import { AlertCenter, CriticalAlertBanner } from '@/components/AlertCenter';
import { AdvancedFilters } from '@/components/AdvancedFilters';
import { MaintenanceReports } from '@/components/MaintenanceReports';
import { Paginated } from '@/components/Pagination';
import { EquipmentTable } from '@/components/EquipmentTable';
import { MaintenanceHistoryPanel } from '@/components/MaintenanceHistoryPanel';
import { AuditLogViewer } from '@/components/AuditLogViewer';
import { Header } from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Equipment } from '@/lib/validationSchemas';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * Página principal refatorada com todas as melhorias implementadas
 */
export default function Index() {
  // Data loading
  const { data: equipment = [], isLoading, error } = useEquipmentList();
  const { data: alerts = [] } = useUnreadAlerts();

  // State
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>(equipment);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

  // Auto alerts
  useAutoAlerts(equipment);

  // Error handling
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-900">Erro ao carregar dados</h1>
          <p className="text-red-700 mt-2">
            Verifique sua conexão com o Supabase and tente novamente.
          </p>
        </div>
      </div>
    );
  }

  const selectedEquipment = equipment.find(e => e.id === selectedEquipmentId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Critical Alerts Banner */}
        <CriticalAlertBanner />

        {/* Alert Center (floating bell) */}
        <div className="fixed bottom-6 right-6 z-40">
          <AlertCenter />
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-4 text-gray-600">Carregando equipamentos...</p>
          </Card>
        )}

        {!isLoading && equipment.length === 0 && (
          <Card className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
            <p className="text-gray-600">Nenhum equipamento encontrado. Importe um arquivo Excel.</p>
          </Card>
        )}

        {!isLoading && equipment.length > 0 && (
          <Tabs defaultValue="equipment" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="equipment">
                📋 Equipamentos ({filteredEquipment.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                📊 Histórico
              </TabsTrigger>
              <TabsTrigger value="reports">
                📈 Relatórios
              </TabsTrigger>
              <TabsTrigger value="audit">
                🔒 Auditoria
              </TabsTrigger>
            </TabsList>

            {/* Equipment Tab */}
            <TabsContent value="equipment" className="space-y-4">
              {/* Filters */}
              <Card className="p-6">
                <AdvancedFilters
                  equipment={equipment}
                  onFiltersChange={setFilteredEquipment}
                />
              </Card>

              {/* Table with Pagination */}
              <Card className="p-6">
                <Paginated
                  items={filteredEquipment}
                  itemsPerPage={20}
                  onPageChange={page => {
                    // Optional: Log page changes
                    console.log('Page changed:', page);
                  }}
                >
                  {(items, pageInfo) => (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600">
                        Página {pageInfo.currentPage} de {pageInfo.totalPages}
                      </div>
                      <EquipmentTable
                        equipment={items}
                        onSelectEquipment={setSelectedEquipmentId}
                      />
                    </div>
                  )}
                </Paginated>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              {!selectedEquipmentId ? (
                <Card className="p-6 text-center text-gray-500">
                  <p>Selecione um equipamento na aba de Equipamentos para ver o histórico</p>
                </Card>
              ) : (
                <Card className="p-6">
                  <MaintenanceHistoryPanel equipmentId={selectedEquipmentId} />
                </Card>
              )}
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <MaintenanceReports equipment={filteredEquipment} />
            </TabsContent>

            {/* Audit Tab */}
            <TabsContent value="audit" className="space-y-4">
              {!selectedEquipmentId ? (
                <Card className="p-6 text-center text-gray-500">
                  <p>Selecione um equipamento para ver o histórico de alterações</p>
                </Card>
              ) : (
                <Card className="p-6">
                  <AuditLogViewer
                    resourceType="EQUIPMENT"
                    resourceId={selectedEquipmentId}
                  />
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
