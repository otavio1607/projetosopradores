
# Plano: Adicionar Elevação/Andar aos Sopradores + Planilha Completa para Power BI

## Resumo
Vou adicionar os campos "Elevação" (andar) e "Altura" para cada soprador conforme a tabela fornecida, criar uma planilha Excel completa com todos os dados, e preparar gráficos otimizados para Power BI.

---

## O Que Será Feito

### 1. Adicionar Campos de Localização
- Novo campo **"elevacao"** (andar/nível) - valores como 9, 10, 11, 12, 13, 14, 15, 16
- Novo campo **"altura"** (metros) - valores como 0.500, 1.000, 1.250, 3.700, etc.
- Exibir esses dados na tabela de equipamentos

### 2. Mapeamento Completo dos 173 Sopradores
Baseado na imagem fornecida, cada SPD terá sua elevação e altura específica:

| SPD | ELEV | ALTURA | SPD | ELEV | ALTURA |
|-----|------|--------|-----|------|--------|
| 101 | 16   | 1,000  | 191 | 14   | 3,700  |
| 102 | 16   | 1,000  | 192 | 14   | 3,700  |
| ... | ...  | ...    | ... | ...  | ...    |
| 313 | 10   | 0,100  | 315 | 9    | 0,820  |

### 3. Atualizar Interface
- Mostrar coluna "Andar" na tabela principal
- Adicionar filtro por elevação
- Cards de estatística por andar

### 4. Planilha Excel Completa para Power BI
O arquivo exportado incluirá:

**Aba 1 - Dados Principais:**
- TAG, Elevação, Altura, Área, Tipo
- Status Geral, Próxima Manutenção, Dias Restantes
- Todas as 13 colunas de manutenção com datas

**Aba 2 - Resumo por Elevação (para gráficos):**
- Contagem de equipamentos por andar
- Status consolidado por elevação

**Aba 3 - Resumo por Tipo de Serviço:**
- Quantidade de manutenções pendentes por tipo
- Total de atrasados, críticos, atenção

**Aba 4 - Timeline (para gráfico de Gantt):**
- Lista de todas as próximas manutenções ordenadas por data
- Ideal para visualização temporal no Power BI

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/equipment.ts` | Adicionar campos `elevacao` e `altura` |
| `src/utils/excelParser.ts` | Mapeamento completo SPD→Elevação→Altura + melhorar exportação |
| `src/components/EquipmentTable.tsx` | Mostrar coluna de Andar |
| `src/components/Header.tsx` | Manter botão de exportação |
| `public/data/equipamentos.xlsx` | Gerar novo arquivo com dados completos |

---

## Detalhes Técnicos

### Estrutura do Mapeamento de Elevações
```text
const elevationData: Record<number, { elev: number; altura: number }> = {
  101: { elev: 16, altura: 1.000 },
  102: { elev: 16, altura: 1.000 },
  103: { elev: 16, altura: 1.000 },
  // ... todos os 173 sopradores
  313: { elev: 10, altura: 0.100 },
  314: { elev: 10, altura: 0.100 },
  315: { elev: 9, altura: 0.820 },
  136: { elev: 9, altura: 0.820 }, // duplicado no final
};
```

### Nova Interface Equipment
```text
interface Equipment {
  id: string;
  tag: string;
  elevacao: number;      // NOVO
  altura: number;        // NOVO
  descricao: string;
  area: string;
  tipo: string;
  manutencoes: MaintenanceRecord[];
  // ...
}
```

### Exportação Melhorada para Power BI
```text
function exportToPowerBI(equipment: Equipment[]) {
  // Aba 1: Dados completos
  // Aba 2: Pivot por Elevação
  // Aba 3: Pivot por Tipo de Serviço
  // Aba 4: Timeline de manutenções
}
```

---

## Resultado Final

Após a implementação:
- A tabela mostrará o andar de cada soprador
- O arquivo Excel exportado terá 4 abas prontas para Power BI
- Os dados estarão formatados para criar gráficos de:
  - Pizza: Status por elevação
  - Barras: Manutenções por tipo
  - Gantt: Timeline de próximas manutenções
  - Mapa de calor: Urgência por andar
