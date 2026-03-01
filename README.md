# 🔥 Sistema de Gestão de Manutenção — Sopradores de Fuligem

Sistema web para controle de manutenção preventiva de **177 sopradores de fuligem**, com exportação para Power BI, histórico CSV e download consolidado em ZIP.

---

## 🚀 Como Rodar no VS Code

## 🌐 GitHub Pages

Deploy automático habilitado via workflow em `.github/workflows/deploy-pages.yml`.

- URL esperada: `https://otavio1607.github.io/projetosopradores/`
- Após push na branch `main`, o deploy roda automaticamente.
- No GitHub: **Settings → Pages → Source: GitHub Actions**.

### Pré-requisitos

- **Node.js** v18+ → [download](https://nodejs.org/)
- **Git** → [download](https://git-scm.com/)
- **VS Code** → [download](https://code.visualstudio.com/)

### Extensões Recomendadas

| Extensão | Finalidade |
|----------|-----------|
| Tailwind CSS IntelliSense | Autocomplete Tailwind |
| ESLint | Linting |
| ES7+ React snippets | Snippets React/TS |

### Instalação

```bash
git clone <URL_DO_REPOSITORIO>
cd <NOME_DA_PASTA>
npm install
npm run dev
```

Acesse **http://localhost:8080**

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento (porta 8080) |
| `npm run build` | Build de produção (`dist/`) |
| `npm run preview` | Preview do build |

---

## 📁 Estrutura do Projeto

```
public/
  data/equipamentos.xlsx          ← Planilha fonte (lida ao iniciar)
  downloads/                      ← Arquivos para download
src/
  components/
    Header.tsx                    ← Barra com ações (importar/exportar)
    EquipmentTable.tsx            ← Tabela expansível de equipamentos
    MaintenanceCard.tsx           ← Card editável de manutenção
    MaintenanceCalendar.tsx       ← Calendário global
    MaintenanceTimeline.tsx       ← Top 50 urgências
    ElevationChart.tsx            ← Gráfico por elevação
    StatCard.tsx                  ← Cards de KPI
  pages/Index.tsx                 ← Página principal
  types/equipment.ts              ← Tipos + dados de elevação
  utils/excelParser.ts            ← Parser Excel + exportações
```

---

## 🔗 Como Tudo se Conecta

```
  ┌────────────────┐
  │  Excel (.xlsx) │──leitura──▶ App React ──exporta──▶ Power BI (.xlsx)
  │  public/data/  │            (navegador)              6 abas otimizadas
  └────────────────┘                │
                                    ├──exporta──▶ Histórico CSV
                                    └──exporta──▶ ZIP completo
```

| Componente | Conexão | Detalhes |
|-----------|---------|---------|
| **Excel → App** | ✅ Automática | `public/data/equipamentos.xlsx` lida ao iniciar |
| **App → Power BI** | ✅ Manual | Botão "Exportar Power BI" gera `.xlsx` com 6 abas |
| **App → CSV** | ✅ Manual | Botão "Histórico CSV" gera registro completo |
| **App → ZIP** | ✅ Manual | Botão "Download ZIP" consolida tudo |
| **VS Code → App** | ✅ Live | `npm run dev` com hot-reload automático |

### Como Atualizar Dados

1. **Editar planilha:** Modifique `public/data/equipamentos.xlsx` → recarregue o app
2. **Importar via app:** Botão "Importar" no header → selecione `.xlsx`
3. **Editar no app:** Clique em cards de manutenção → selecione nova data ou "Concluir"

---

## 📊 Power BI — 6 Abas Exportadas

| Aba | Conteúdo |
|-----|----------|
| Dados Principais | Todos os equipamentos + status + datas |
| Resumo por Elevação | Contagem por nível |
| Serviços por Tipo | Conformidade por manutenção |
| Timeline | Dados para Gantt |
| Distribuição por Área | Breakdown por região |
| Resumo Geral | KPIs consolidados |

**No Power BI Desktop:** Obter Dados → Pasta de Trabalho do Excel → importar abas → criar dashboards.

---

## 🔧 9 Tipos de Manutenção

| Serviço | Periodicidade |
|---------|--------------|
| Troca de Cabos | Anual |
| Troca de Redutor | 2 Anos |
| Troca de Caixa Oca | 3 Anos |
| Troca de Esticador | Anual |
| Troca de Corrente | Anual |
| Troca de Embreagem | 2 Anos |
| Troca de Lança | 3 Anos |
| Troca de Micro | Semestral |
| Limpeza Caixa de Selagem | Mensal |

---

## 📋 Tecnologias

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Recharts · xlsx · JSZip · date-fns (pt-BR)
