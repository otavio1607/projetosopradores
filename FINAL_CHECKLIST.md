# 📋 Checklist Final - O Que Falta Para Finalizar

## 🎯 Status Geral: **70% Completo**

---

## **CRÍTICO - Bloqueia deploy** ⛔

### 1. ✅ **Integração de Componentes Novos**
**Prioridade:** 🔴 ALTA  
**Status:** ❌ Não iniciado  

O arquivo `Index.refactored.tsx` foi criado mas não está integrado. Precisa substituir o `Index.tsx` atual:

```bash
# Opções:
# 1. Copiar conteúdo para Index.tsx
# 2. Manter ambos (um é backup)
# 3. Integrar gradualmente
```

**O que falta:**
- [ ] Copiar `Index.refactored.tsx` →  `Index.tsx`
- [ ] Testar AlertCenter funciona
- [ ] Testar AdvancedFilters filtra corretamente
- [ ] Testar Paginação carrega 20 equipamentos
- [ ] Testar MaintenanceReports renderiza gráficos

---

### 2. ✅ **Conectar ao Supabase (BD Real)**
**Prioridade:** 🔴 ALTA  
**Status:** ❌ Não iniciado  

Atualmente usa arquivo Excel local. Precisa:

```bash
# Passos:
1. Executar migrations: supabase/migrations/001_initial_schema.sql
2. Validar RLS policies
3. Testar conexão equipmentService.getAll()
4. Migrar dados de Excel → BD
```

**O que falta:**
- [ ] Script para migrar dados Excel → Supabase
- [ ] Testar queries de equipmentService
- [ ] Implementar sincronização bidirecional
- [ ] Cache/offline strategy

---

### 3. ✅ **Refatorar excelParser.ts**
**Prioridade:** 🔴 ALTA  
**Status:** ❌ Não iniciado  

Atualmente cria `Equipment` manualmente. Precisa usar `equipmentSchema` do Zod:

```typescript
// Antes (atual)
const eq: Equipment = {
  id: uuid(),
  tag: row.TAG,
  // ... manual
}

// Depois (refatorado)
const eq = equipmentSchema.parse({
  id: uuid(),
  tag: row.TAG,
  // ... com validação automática
})
```

**O que falta:**
- [ ] Atualizar parseExcelFile() para usar Zod
- [ ] Adicionar tratamento de erros de validação
- [ ] Criar função de sincronização Excel → API
- [ ] Testar com dados reais

---

## **IMPORTANTE - Impede produção** 🟠

### 4. ✅ **Autenticação & Permissões (RBAC)**
**Prioridade:** 🟠 ALTA  
**Status:** ⚠️ Parcial (schemas criados, não integrados)  

AuthContext existe mas sem RBAC real:

```typescript
// Falta em AuthContext.tsx:
- Buscar role do usuário em users table
- Verificar permissões antes de ações
- Guard routes que exigem admin/supervisor
```

**O que falta:**
- [ ] Atualizar AuthContext para carregar `role`
- [ ] Adicionar `usePermission()` hook
- [ ] Proteger rotas por papel (Admin < Supervisor < Tecnico < Viewer)
- [ ] Adicionar badge de permissão no Header
- [ ] Auditar ações (create, update, delete)

---

### 5. ✅ **Notificações por Email**
**Prioridade:** 🟠 MÉDIA  
**Status:** ❌ Esqueleto criado (não funciona)  

`useAutoAlerts.ts` tenta enviar email para `/api/send-alert-email` que não existe:

```typescript
// Hoje:
await fetch('/api/send-alert-email', {
  // ... envia para endpoint que não existe
})

// Precisa:
// 1. Backend em Node.js/Python
// 2. SendGrid/Resend/AWS SES
// 3. Autenticação de API
```

**O que falta:**
- [ ] Criar backend para email alerts (opcional para MVP)
- [ ] Integrar SendGrid/Resend
- [ ] Template de emails
- [ ] Rate limiting
- [ ] Desabilitar alertas de email por enquanto

---

### 6. ✅ **Documentação & Deploy**
**Prioridade:** 🟠 MÉDIA  
**Status:** ⚠️ Parcial  

Existe `IMPLEMENTATION_GUIDE.md` mas falta:

**O que falta:**
- [ ] Documentação de Deployment (Vercel, Netlify, etc)
- [ ] Guia de configuração Supabase
- [ ] Variáveis de ambiente produção
- [ ] Scripts de backup
- [ ] Guia de troubleshooting

---

## **BÔNUS - Melhorias pós-MVP** 🟢

### 7. 🟢 **Testes E2E**
**Prioridade:** 🟢 BAIXA  
**Status:** ❌ Não iniciado  

Criar testes com Playwright/Cypress:
- [ ] Login e logout
- [ ] Importar Excel
- [ ] Filtrar equipamentos
- [ ] Exportar Power BI
- [ ] Criar alerta

---

### 8. 🟢 **Dark Mode**
**Prioridade:** 🟢 BAIXA  
**Status:** ❌ Não iniciado  

Adicionar theme switcher:
- [ ] Integrar `next-themes`
- [ ] Adicionar toggle no Header
- [ ] Validar Tailwind dark mode

---

### 9. 🟢 **Performance**
**Prioridade:** 🟢 BAIXA  
**Status:** ⚠️ Parcial (paginação criada, não integrada)  

- [ ] Virtualização de listas grandes (react-window)
- [ ] Code splitting de rotas
- [ ] Lazy loading de gráficos
- [ ] WebWorkers para cálculos pesados
- [ ] Service Workers para offline

---

### 10. 🟢 **Melhorias UX**
**Prioridade:** 🟢 BAIXA  
**Status:** ⚠️ Parcial  

- [ ] Drag-drop para import
- [ ] Shortcut keys (Cmd+K para busca)
- [ ] Undo/Redo de ações
- [ ] Bulk actions (selecionar múltiplos)
- [ ] Notificações web push

---

## 📊 **Checklist Resumido (Ordem de Execução)**

```
SEMANA 1 (URGENTE)
  [ ] 1. Integrar Index.refactored.tsx → Index.tsx
  [ ] 2. Executar migrations Supabase
  [ ] 3. Testar equipmentService.getAll()
  [ ] 4. Refatorar excelParser com Zod
  [ ] 5. Desabilitar alertas por email temporariamente

SEMANA 2 (IMPORTANTE)
  [ ] 6. Implementar RBAC em AuthContext
  [ ] 7. Adicionar permissões ao Header
  [ ] 8. Script de migração Excel → BD
  [ ] 9. Testes unitários (npm run test)
  [ ] 10. Documentar variáveis .env

SEMANA 3 (BÔNUS)
  [ ] 11. Dark mode
  [ ] 12. Testes E2E
  [ ] 13. Deploy em staging
  [ ] 14. Load testing (177 equipamentos * 9 manutenções cada)
  [ ] 15. Documentação final
```

---

## 🔧 **Tarefas Técnicas Detalhadas**

### **Tarefa 1: Integrar Index.refactored.tsx**

```bash
# 1. Fazer backup
cp src/pages/Index.tsx src/pages/Index.backup.tsx

# 2. Substituir (OPÇÃO A - rápido)
cp src/pages/Index.refactored.tsx src/pages/Index.tsx
rm src/pages/Index.refactored.tsx

# 3. Ou mesclar manualmente (OPÇÃO B - seguro)
# Compare os dois e incorpore apenas as novas funcionalidades
```

**O que vai mudar:**
- TabsComponent para organizar: Equipamentos, Histórico, Relatórios, Auditoria
- AlertCenter flutuante
- AdvancedFilters integrada
- MaintenanceReports com 5 gráficos
- Paginação automática

---

### **Tarefa 2: Executar Migrations**

```sql
-- 1. Abra https://app.supabase.com
-- 2. Vá em: SQL Editor
-- 3. Copie todo conteúdo de: supabase/migrations/001_initial_schema.sql
-- 4. Execute

-- Após, verifique:
-- Tables: equipment, maintenance_records, maintenance_history, alerts, audit_logs
-- RLS: Ativado em todas as tabelas
-- Triggers: updated_at automático
```

---

### **Tarefa 3: Testar equipmentService**

```typescript
// src/pages/Index.tsx
import { useEquipmentList } from '@/hooks/useEquipment';

const { data: equipment, isLoading, error } = useEquipmentList();

console.log('Equipment:', equipment); // Deve vir do Supabase
console.log('Error:', error); // Se houver problema de conexão
```

---

### **Tarefa 4: Refatorar excelParser**

```typescript
// Adicionar no parseExcelFile():
import { equipmentSchema, maintenanceRecordSchema } from '@/lib/validationSchemas';

try {
  const validated = equipmentSchema.parse({
    id: uuid(),
    tag,
    elevacao,
    // ...
  });
  return validated;
} catch (error) {
  console.error('Validação falhou:', error.errors);
  throw new Error('Formato de Excel inválido');
}
```

---

### **Tarefa 5: Implementar RBAC**

```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  role: 'admin' | 'supervisor' | 'tecnico' | 'viewer'; // Adicionar
  canPerform: (action: string) => boolean; // Adicionar
  // ...
}

// Buscar role do usuário
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();
```

---

## ⚠️ **Riscos & Dependências**

| Risco | Impacto | Solução |
|-------|--------|--------|
| Dados Excel não sincronizarem com BD | 🔴 Alto | Script de migração automático |
| CORS bloqueado Supabase | 🔴 Alto | Configurar allow origins |
| Performance com 177 × 9 registros | 🟡 Médio | Paginação + Índices BD |
| Email alerts falham silenciosamente | 🟢 Baixo | Desabilitar temporariamente |

---

## 📦 **Dependências Externas**

```json
{
  "já_instaladas": [
    "recharts (gráficos)",
    "date-fns (datas)",
    "zod (validação)",
    "react-query (data fetching)",
    "supabase-js (BD)"
  ],
  "faltam": [
    "sendgrid-mail (email - opcional)",
    "@playwright/test (E2E - opcional)",
    "next-themes (dark mode - opcional)"
  ]
}
```

---

## 🚀 **Para Deploy Imediato (MVP)** 

Se quiser colocar em produção HOJE:

✅ **Está pronto:**
- Autenticação Supabase
- Importação/Exportação Excel
- Tabelas e visualizações
- Design responsivo

❌ **Desabilitar:**
- Email alerts (comentar fetch em useAutoAlerts.ts)
- Auditoria RBAC (usar default viewer)
- Histórico de manutenção (BD vazio)

```bash
# Deploy rápido (comentar linhas perigosas):
npm run build
# Fazer deploy do dist/ folder
```

---

## 📞 **Questões para Você**

1. **Banco de dados:** Usar Supabase ou continuar com Excel?
   - [ ] Supabase (recomendado)
   - [ ] Excel (mais rápido inicialmente)

2. **Email alerts:** Implementar agora ou depois?
   - [ ] Agora (precisa SendGrid)
   - [ ] Depois (MVP sem email)

3. **RBAC:** Implementar controle de acesso?
   - [ ] Sim (supervisores vs técnicos)
   - [ ] Não (todos tem acesso igual)

4. **Timeline:** Quando precisa estar pronto?
   - [ ] Esta semana (MVP)
   - [ ] Próxima semana (completo)
   - [ ] Próximo mês (perfeito)

---

**Baseado nas respostas, posso priorizar as tarefas corretas!** 🎯
