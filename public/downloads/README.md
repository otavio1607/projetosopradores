# Sistema de Manutenção de Sopradores

## Arquivos incluídos

### Excel (Sopradores_Manutencao.xlsx)
- **Sopradores**: Lista completa de todos os sopradores com suas características
- **Tipos Manutenção**: Catálogo de tipos de manutenção e periodicidades
- **Manutenções**: Registro detalhado de manutenções por soprador
- **Resumo**: Visão consolidada por tipo de manutenção
- **Histórico Mensal**: Dados históricos dos últimos 12 meses
- **Tendência**: Dados para análise de tendência
- **Distribuição Área**: Distribuição de equipamentos por área

### Power BI (PowerBI_Data.csv)
Arquivo CSV otimizado para importação no Power BI Desktop.
- Abra o Power BI Desktop
- Vá em "Obter Dados" > "Texto/CSV"
- Selecione o arquivo PowerBI_Data.csv
- Configure as colunas conforme necessário

### VS Code
Para executar o projeto localmente:

1. Clone ou extraia este projeto
2. Abra a pasta no VS Code
3. Execute no terminal:
   ```
   npm install
   npm run dev
   ```
4. Acesse http://localhost:5173 no navegador

## Tipos de Manutenção

| Tipo | Periodicidade |
|------|---------------|
| Troca de Cabos | Anual |
| Troca de Redutor | 2 Anos |
| Troca de Caixa Oca | 3 Anos |
| Troca de Esticador | Anual |
| Troca de Corrente | Anual |
| Troca de Embreagem | 2 Anos |
| Troca de Lança | 3 Anos |
| Troca de Micro | Semestral |
| Limpeza Caixa de Selagem | Mensal |

## Status

- **Em Dia**: Manutenção dentro do prazo
- **Próximo**: Vencimento próximo (< 15 dias)
- **Atrasado**: Manutenção vencida
- **Pendente**: Aguardando primeira execução

---
Gerado em: 31/01/2026, 14:15:40
