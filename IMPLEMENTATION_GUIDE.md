# 🚀 Guia de Implementação - Melhorias do Sistema

Este documento descreve as **12 melhorias implementadas** para o sistema de gestão de manutenção.

## ✅ Melhorias Implementadas

### 1️⃣ **Schemas Supabase + BD Relacional**
**Arquivo:** `supabase/migrations/001_initial_schema.sql`

Crie as tabelas no Supabase:
- `equipment` - Equipamentos
- `maintenance_records` - Registros de manutenção
- `maintenance_history` - Histórico de manutenções
- `alerts` - Alertas automáticos
- `users` - Dados adicionais do usuário
- `audit_logs` - Logs de auditoria

**Como usar:**
```sql
-- Execute no Supabase SQL Editor
-- Copie o conteúdo de supabase/migrations/001_initial_schema.sql
```

---

### 2️⃣ **Lógica Centralizada de Cálculos**
**Arquivo:** `src/lib/maintenanceCalculations.ts`

Remove duplicação de código com funções reutilizáveis:
- `calculateDaysRemaining()` - Calcula dias until manutenção
- `getStatus()` - Determina status (ok/warning/critical/overdue)
- `getOverallStatus()` - Status geral do equipamento
- `calculateStats()` - Estatísticas consolidadas
- `findRecurrentIssues()` - Detecta problemas recorrentes

**Exemplo:**
```typescript
import { calculateDaysRemaining, getStatus } from '@/lib/maintenanceCalculations';

const days = calculateDaysRemaining(new Date('2026-03-10'));
const status = getStatus(days); // 'critical' se days <= 7
```

---

### 3️⃣ **Validação com Zod**
**Arquivo:** `src/lib/validationSchemas.ts`

Schemas para validação type-safe:
- Validação em tempo de runtime
- Type inference automático
- Suporta arrays, datas, enums

**Exemplo:**
```typescript
import { equipmentSchema } from '@/lib/validationSchemas';

const validated = equipmentSchema.parse(data);
// Lança erro se dados inválidos
```

---

### 4️⃣ **Serviços para Banco de Dados**
**Arquivo:** `src/services/equipmentService.ts`

Service layer desacoplado:
- `equipmentService` - CRUD de equipamentos
- `maintenanceHistoryService` - Histórico
- `alertService` - Alertas
- `statsService` - Estatísticas

**Exemplo:**
```typescript
import { equipmentService } from '@/services/equipmentService';

const equipment = await equipmentService.getAll();
const one = await equipmentService.getById('id');
await equipmentService.create(newEquipment);
```

---

### 5️⃣ **Sistema de Alertas Automático**
**Arquivo:** `src/hooks/useAutoAlerts.ts` + `src/components/AlertCenter.tsx`

Monitora automaticamente manutenções:
- Cria alertas para status crítico/atrasado
- Notificações do navegador
- Integração com email (opcional)

**Como usar:**
```typescript
// Na página principal
import { useAutoAlerts } from '@/hooks/useAutoAlerts';
import { AlertCenter, CriticalAlertBanner } from '@/components/AlertCenter';

export function App() {
  const { data: equipment } = useEquipmentList();
  useAutoAlerts(equipment); // Monitora e cria alertas

  return (
    <>
      <AlertCenter /> {/* Bell icon com alertas */}
      <CriticalAlertBanner /> {/* Banner destacado */}
    </>
  );
}
```

---

### 6️⃣ **Histórico Completo de Manutenção**
**Arquivo:** `src/components/MaintenanceHistoryPanel.tsx`

Visualize o histórico de cada equipamento:
- Timeline dos últimos 6 meses
- Quem realizou cada manutenção
- Data de próxima manutenção
- Notas e resultado

**Exemplo:**
```tsx
<MaintenanceHistoryPanel equipmentId="eq-123" />
<MaintenanceTimeline equipmentId="eq-123" />
```

---

### 7️⃣ **Filtros Avançados**
**Arquivo:** `src/components/AdvancedFilters.tsx`

Filtre equipamentos por:
- Busca (tag, descrição, área)
- Status (ok/warning/critical/overdue)
- Área
- Tipo de equipamento
- Dias até próxima manutenção

**Exemplo:**
```tsx
const [filtered, setFiltered] = useState(equipment);

<AdvancedFilters 
  equipment={equipment}
  onFiltersChange={setFiltered}
/>

// Depois use 'filtered' na tabela
```

---

### 8️⃣ **Testes Unitários**
**Arquivo:** `src/lib/maintenanceCalculations.test.ts`

Run with:
```bash
npm run test        # Testa uma vez
npm run test:watch # Modo watch
```

Cobertura:
- Cálculo de dias
- Determinação de status
- Estatísticas
- Problemas recorrentes

---

### 9️⃣ **Relatórios e Gráficos**
**Arquivo:** `src/components/MaintenanceReports.tsx`

Visualizações com Recharts:
- 📊 Distribuição de status (Pie chart)
- 📈 Equipamentos por área
- 📉 Distribuição de dias
- 🔴 Tipos mais atrasados
- 📍 Scatter: Elevação vs Urgência

**Exemplo:**
```tsx
<MaintenanceReports equipment={equipment} />
```

---

### 🔟 **Melhorias UX/UI**
Implementadas:
- ✅ Busca global
- ✅ Filtros inline com badges
- ✅ Dark mode support
- ✅ Responsividade
- ✅ Drag-drop para import

---

### 1️⃣1️⃣ **Performance - Paginação**
**Arquivo:** `src/components/Pagination.tsx`

Componente genérico de paginação:
```tsx
import { Paginated } from '@/components/Pagination';

<Paginated items={equipment} itemsPerPage={20}>
  {(items) => (
    <table>
      {items.map(eq => <tr key={eq.id}>...</tr>)}
    </table>
  )}
</Paginated>
```

Ou use o hook:
```typescript
const {
  paginatedItems,
  currentPage,
  totalPages,
  nextPage,
  previousPage,
  goToPage
} = usePagination(equipment);
```

---

### 1️⃣2️⃣ **Segurança - RBAC + Auditoria**
**Arquivos:** 
- `src/services/rbacService.ts` - Controle de acesso
- `src/components/AuditLogViewer.tsx` - Visualização de logs

**Roles disponíveis:**
- `admin` - Acesso total
- `supervisor` - Criar/ler/atualizar
- `tecnico` - Registrar manutenções
- `viewer` - Apenas leitura

**Auditoria automática:**
```typescript
import { auditService, AUDIT_ACTIONS } from '@/services/rbacService';

await auditService.log(
  AUDIT_ACTIONS.UPDATE,
  'EQUIPMENT',
  equipmentId,
  { field: 'status', old: 'ok', new: 'warning' },
  user
);
```

**Visualizar logs:**
```tsx
<AuditLogViewer resourceType="EQUIPMENT" resourceId={id} />
```

---

## 🔌 Integração com React Query Hooks

Todos os serviços têm hooks wrapper:

**Arquivo:** `src/hooks/useEquipment.ts`

```typescript
import {
  useEquipmentList,      // GET todos
  useEquipment,          // GET um
  useCreateEquipment,    // POST
  useUpdateEquipment,    // PUT
  useDeleteEquipment,    // DELETE
  useUnreadAlerts,       // GET alertas
  useMaintenanceHistory, // GET histórico
  useMaintenanceStats,   // GET stats
} from '@/hooks/useEquipment';

export function MyComponent() {
  const { data, isLoading } = useEquipmentList();
  const { mutate: create } = useCreateEquipment();

  return (
    <div>
      {isLoading && <div>Carregando...</div>}
      {data?.map(eq => <div key={eq.id}>{eq.tag}</div>)}
    </div>
  );
}
```

---

## 📝 Próximos Passos

### 1. Execute as migrações Supabase
```sql
-- Abra Supabase SQL Editor
-- Copie: supabase/migrations/001_initial_schema.sql
-- Execute tudo
```

### 2. Integre no Index.tsx
```typescript
import { useEquipmentList } from '@/hooks/useEquipment';
import { useAutoAlerts } from '@/hooks/useAutoAlerts';
import { AlertCenter, CriticalAlertBanner } from '@/components/AlertCenter';
import { AdvancedFilters } from '@/components/AdvancedFilters';
import { MaintenanceReports } from '@/components/MaintenanceReports';
import { Paginated } from '@/components/Pagination';

export default function Index() {
  const { data: equipment = [], isLoading } = useEquipmentList();
  const [filtered, setFiltered] = useState(equipment);

  useAutoAlerts(equipment);

  return (
    <div className="p-6">
      <AlertCenter />
      <CriticalAlertBanner />
      
      <AdvancedFilters 
        equipment={equipment}
        onFiltersChange={setFiltered}
      />

      <Paginated items={filtered} itemsPerPage={20}>
        {(items) => (
          <table>
            {/* Seu código da tabela */}
          </table>
        )}
      </Paginated>

      <MaintenanceReports equipment={filtered} />
    </div>
  );
}
```

### 3. Configure Notificações por Email
Crie uma API endpoint `/api/send-alert-email` que use SendGrid/Resend

### 4. Execute os testes
```bash
npm run test:watch
```

---

## 📊 Impacto das Melhorias

| Melhoria | Impacto | Esforço |
|----------|--------|--------|
| Persistência BD | 🔴 Muito Alto | 📈 Médio |
| Alertas | 🟡 Alto | ✅ Baixo |
| Filtros | 🟢 Médio | ✅ Baixo |
| Histórico | 🟡 Alto | 📈 Médio |
| Performance | 🟢 Médio | ✅ Baixo |
| Testes | 🟢 Médio | ✅ Baixo |
| RBAC | 🟡 Alto | 📈 Médio |
| Relatórios | 🟡 Alto | 📈 Médio |

---

## 🎯 Checklist de Implementação

- [ ] Criar tabelas no Supabase
- [ ] Atualizar `vite.config.ts` se necessário
- [ ] Integrar hooks no Index.tsx
- [ ] Testar AlertCenter
- [ ] Testar Filtros
- [ ] Testar Paginação
- [ ] Testar Relatórios
- [ ] Implementar RBAC no Header
- [ ] Setup notificações por email
- [ ] Treinar usuários

---

## 🆘 Troubleshooting

**Erro: "Cannot find module"**
```bash
# Verifique os imports
# use absolute paths com @/
```

**Erro: "Supabase connection"**
```bash
# Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
```

**Alertas não aparecem**
```typescript
// Verifique se useAutoAlerts está sendo chamado
// Verifique se alerts estão na tabela
```

---

**Desenvolvido com ❤️ para melhorar seu sistema**
