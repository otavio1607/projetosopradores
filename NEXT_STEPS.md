# 🚀 PRÓXIMAS SEMANAS - Roadmap Completo

## 📅 SEMANA 1 (HOJE) - MVP ✅
**Status:** ✅ PRONTO PARA DEPLOY

```
✅ Autenticação Supabase
✅ Importação/Exportação Excel
✅ Tabelas e visualizações
✅ Cálculos de manutenção
✅ Design responsivo
✅ Todos os componentes UI criados

⬜ (Desabilitado até Supabase estar pronto)
  - Banco de dados real
  - RBAC (roles/permissions)
  - Auditoria
  - Alertas por email
```

**Para fazer deploy agora:**
```bash
npm run build
# Fazer deploy do dist/ folder para Vercel/Netlify
```

---

## 📅 SEMANA 2 - Supabase + RBAC

### **TAREFA 1: Ativar Supabase** (2-3 horas)

#### 1.1 Executar migrations
```bash
# 1. Acesse https://app.supabase.com
# 2. Projeto > SQL Editor
# 3. Copie TODO conteúdo de:
cp supabase/migrations/001_initial_schema.sql
# 4. Execute no SQL Editor
# 5. Verifique se as 5 tabelas foram criadas:
#    - equipment
#    - maintenance_records
#    - maintenance_history
#    - alerts
#    - audit_logs
```

#### 1.2 Validar RLS Policies
```sql
-- Verificar se RLS está ativado:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- Deve mostrar: true em todas as linhas
```

#### 1.3 Testar conexão no app
```typescript
// src/pages/Index.tsx linha ~45
import { useEquipmentList } from '@/hooks/useEquipment';

const { data: equipment, isLoading, error } = useEquipmentList();

if (error) {
  console.error('Erro Supabase:', error);
  // Se deu erro aqui, migrations não funcionaram
}
```

---

### **TAREFA 2: Implementar RBAC** (3-4 horas)

#### 2.1 Atualizar AuthContext.tsx
```typescript
// src/contexts/AuthContext.tsx

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'supervisor' | 'tecnico' | 'viewer'; // NOVO
  canPerform: (action: string) => boolean; // NOVO
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  // ... resto
}

// Na função AuthProvider, adicione:
useEffect(() => {
  const loadUserRole = async () => {
    if (!session?.user) return;
    
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    // Setar role do usuário
    setRole(userData?.role || 'viewer');
  };
  
  loadUserRole();
}, [session?.user]);
```

#### 2.2 Adicionar hook usePermission
```typescript
// src/hooks/usePermission.ts (NOVO)
export function usePermission() {
  const { role, canPerform } = useAuth();
  
  return {
    isAdmin: role === 'admin',
    isSupervisor: role === 'supervisor' || role === 'admin',
    isTecnico: role === 'tecnico' || role.includes('supervisor'),
    canDelete: canPerform('delete'),
    canEdit: canPerform('update'),
    canCreate: canPerform('create'),
  };
}
```

#### 2.3 Proteger componentes por role
```typescript
// No Header.tsx, esconder botões para viewers
const { isAdmin, isSupervisor } = usePermission();

// Mostrar apenas para supervisores+
{(isAdmin || isSupervisor) && (
  <Button onClick={onExport}>Exportar</Button>
)}
```

---

### **TAREFA 3: Integrar Novos Componentes** (2-3 horas)

#### 3.1 Copiar Index.refactored.tsx → Index.tsx

Quando Supabase estiver pronto:
```bash
# 1. Backup
cp src/pages/Index.tsx src/pages/Index.backup-mvp.tsx

# 2. Substituir
cp src/pages/Index.refactored.tsx src/pages/Index.tsx

# 3. Testar
npm run dev
# Deve mostrar 4 abas: Equipamentos, Histórico, Relatórios, Auditoria
```

**Novo layout:**
```
┌─────────────────────────────────┐
│ Header (com botões de ação)     │
├─────────────────────────────────┤
│ ⚠️ Critical Alert Banner         │
├─────────────────────────────────┤
│ 📋 │ 📊 │ 📈 │ 🔒 Tabs         │
├─────────────────────────────────┤
│ Conteúdo da aba selecionada     │
│                                 │
│ 🔔 Alert Center (floating)      │
└─────────────────────────────────┘
```

#### 3.2 Ativar Componentes

Que ficam **desabilidados** agora e serão ativados:

```typescript
// src/pages/Index.tsx - DESCOMENTAR próxima semana:

// import { useEquipmentList } from '@/hooks/useEquipment';
// import { AdvancedFilters } from '@/components/AdvancedFilters';
// import { MaintenanceReports } from '@/components/MaintenanceReports';

// Quando pronto:
// const { data: equipment } = useEquipmentList(); // Ao invés de loadDefaultData()
```

---

### **TAREFA 4: Migração de Dados** (1-2 horas)

#### 4.1 Script de migração Excel → Supabase

```bash
# Criar arquivo: scripts/migrate-to-supabase.ts
touch scripts/migrate-to-supabase.ts
```

```typescript
// scripts/migrate-to-supabase.ts
import { supabase } from '@/integrations/supabase/client';
import { loadDefaultData } from '@/utils/excelParser';

async function migrateExcelToSupabase() {
  try {
    // 1. Ler dados de Excel
    const equipment = await loadDefaultData();
    
    // 2. Inserir em Supabase
    for (const eq of equipment) {
      const { error } = await supabase
        .from('equipment')
        .insert({
          tag: eq.tag,
          elevacao: eq.elevacao,
          altura: eq.altura,
          descricao: eq.descricao,
          area: eq.area,
          tipo: eq.tipo,
          status_geral: eq.statusGeral,
        });
      
      if (error) console.error(`Erro ao inserir ${eq.tag}:`, error);
    }
    
    console.log('✅ Migração completa!');
  } catch (error) {
    console.error('Erro na migração:', error);
  }
}

migrateExcelToSupabase();
```

#### 4.2 Executar migração
```bash
# Opção A: Via Node.js
node -r tsx scripts/migrate-to-supabase.ts

# Opção B: Manual (via Supabase UI)
# 1. Ir em SQL Editor
# 2. INSERT INTO equipment (tag, elevacao, ...) VALUES (...)
# 3. Para cada um dos 177 sopradores
```

---

### **TAREFA 5: Auditoria** (1-2 horas)

#### 5.1 Criar tabela audit_logs

Já existe em `supabase/migrations/001_initial_schema.sql` mas validar:

```sql
SELECT * FROM audit_logs LIMIT 1;
-- Deve existir sem erro
```

#### 5.2 Adicionar logging de ações

```typescript
// Em useEquipment.ts, ao usar mutações:
const { mutate: update } = useUpdateEquipment();

mutate(data, {
  onSuccess: async () => {
    // Log para auditoria
    await auditService.log(
      AUDIT_ACTIONS.UPDATE,
      AUDIT_RESOURCES.EQUIPMENT,
      eq.id,
      { field: 'status', value: newStatus },
      user
    );
  }
});
```

---

## 📅 SEMANA 3+ - Extras & Polish

### Tarefas Opcionais
- [ ] Dark mode
- [ ] Testes E2E (Playwright)
- [ ] Email alerts (SendGrid)
- [ ] Performance (virtualização)
- [ ] Documentação completa

---

## 🔑 Variáveis de Ambiente

Criar `.env.local` com:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...seu-token...
```

Copiar de: Supabase > Project Settings > API

---

## ⚠️ Importante para RBAC

Quando criar usuários no Supabase Auth, **SEMPRE** adicione na tabela `users`:

```sql
INSERT INTO users (id, email, display_name, role)
VALUES (
  'user-uuid-from-auth',
  'email@example.com',
  'Nome do Usuário',
  'supervisor'  -- ou 'tecnico', 'viewer', 'admin'
);
```

Roles:
- **admin**: Tudo (criar, editar, deletar, gerenciar usuários)
- **supervisor**: Criar, editar, visualizar (sem deletar)
- **tecnico**: Registrar manutenções, visualizar
- **viewer**: Apenas visualizar, sem editar

---

## 🧪 Checklist de Validação

Antes de considerar "COMPLETO":

Semana 2:
- [ ] Migrations executadas no Supabase
- [ ] `supabase.from('equipment').select()` retorna dados
- [ ] AuthContext carrega `role` do usuário
- [ ] Header esconde botões para viewers
- [ ] Dados migrados de Excel para BD
- [ ] 177 equipamentos × 9 tipos = ~1600 registros em maintenance_records

Semana 3:
- [ ] Index.refactored.tsx ativado
- [ ] Abas (Equipamentos, Histórico, Relatórios, Auditoria) funcionam
- [ ] AdvancedFilters filtra corretamente
- [ ] MaintenanceReports exibe 5 gráficos
- [ ] AlertCenter mostra alertas
- [ ] Auditoria registra ações

---

## 💡 Dicas

1. **Não delete dados!** Sempre teste em cópia primeiro
2. **RLS é importante** - Sem RLS, qualquer usuário vê tudo
3. **Backups** - Fazer backup do Excel antes de migrar
4. **Teste em staging** - Deploy em Vercel Preview antes de main
5. **Comunique com usuários** - UI vai mudar bastante

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Cannot find module useEquipment" | Migrations não executadas |
| RLS blocks reads | Adicionar `allow: ['select']` em policy |
| Dados não aparecem | Verificar se dados foram inseridos corretamente |
| Alertas não funciona | Email está desabilitado, ativar depois |

---

## 📞 Questões Respondidas

✅ **BD:** Usar Supabase
✅ **Timeline:** MVP hoje (Excel), Completo próxima semana (BD)
✅ **RBAC:** Sim, supervisores/técnicos diferentes

---

**Próximo passo:** Segunda-feira, executar Tarefa 1 (Supabase migrations) 🎯
