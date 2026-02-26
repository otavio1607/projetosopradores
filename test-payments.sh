#!/bin/bash

# Script para validar sistema de pagamentos e licenciamento
# Execução: bash test-payments.sh

echo "🧪 TESTE DO SISTEMA DE PAGAMENTOS E LICENCIAMENTO"
echo "=================================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0

# Função para testar
test_case() {
  local test_name=$1
  local test_command=$2
  
  echo -e "${BLUE}▶ $test_name${NC}"
  
  if eval "$test_command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Passou${NC}\n"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ Falhou${NC}\n"
    ((TESTS_FAILED++))
  fi
}

# ===== TESTES DE IMPORTAÇÃO =====
echo -e "${YELLOW}📦 Testes de Importação${NC}"
echo "======================"

test_case "Importar tipos" "grep -q 'export type PlanType' src/types/licensing.ts"
test_case "Importar LicenseService" "grep -q 'export class LicenseService' src/services/licenseService.ts"
test_case "Importar PaymentService" "grep -q 'export class PaymentService' src/services/paymentService.ts"
test_case "Importar planos" "grep -q 'export const plans' src/lib/paymentPlans.ts"

# ===== TESTES DE COMPONENTES =====
echo -e "${YELLOW}⚛️  Testes de Componentes${NC}"
echo "========================="

test_case "Componente PricingPlans" "grep -q 'export function PricingPlans' src/components/PricingPlans.tsx"
test_case "Componente LicenseManager" "grep -q 'export function LicenseManager' src/components/LicenseManager.tsx"
test_case "Componente PaymentForm" "grep -q 'export function PaymentForm' src/components/PaymentForm.tsx"
test_case "Componente SubscriptionPanel" "grep -q 'export function SubscriptionPanel' src/components/SubscriptionPanel.tsx"
test_case "Page Billing" "grep -q 'export function BillingPage' src/pages/Billing.tsx"

# ===== TESTES DE TIPOS =====
echo -e "${YELLOW}📝 Testes de Tipos${NC}"
echo "=================="

test_case "Type Plan definido" "grep -q 'interface Plan' src/types/licensing.ts"
test_case "Type License definido" "grep -q 'interface License' src/types/licensing.ts"
test_case "Type Subscription definido" "grep -q 'interface Subscription' src/types/licensing.ts"
test_case "Type Payment definido" "grep -q 'interface Payment' src/types/licensing.ts"

# ===== TESTES DE SERVIÇOS =====
echo -e "${YELLOW}🔧 Testes de Serviços${NC}"
echo "===================="

test_case "LicenseService.generateLicenseKey" "grep -q 'generateLicenseKey' src/services/licenseService.ts"
test_case "LicenseService.validateLicense" "grep -q 'validateLicense' src/services/licenseService.ts"
test_case "LicenseService.activateLicense" "grep -q 'activateLicense' src/services/licenseService.ts"
test_case "PaymentService.processPixPayment" "grep -q 'processPixPayment' src/services/paymentService.ts"
test_case "PaymentService.processCardPayment" "grep -q 'processCardPayment' src/services/paymentService.ts"

# ===== TESTES DE PLANOS =====
echo -e "${YELLOW}💰 Testes de Planos${NC}"
echo "==================="

test_case "Plano Gratuito existe" "grep -q \"id: 'free'\" src/lib/paymentPlans.ts"
test_case "Plano Pro existe" "grep -q \"id: 'pro'\" src/lib/paymentPlans.ts"
test_case "Plano Enterprise existe" "grep -q \"id: 'enterprise'\" src/lib/paymentPlans.ts"
test_case "Plano Pro Anual existe" "grep -q \"id: 'annual-pro'\" src/lib/paymentPlans.ts"

# ===== TESTES DE FEATURES =====
echo -e "${YELLOW}⚡ Testes de Features${NC}"
echo "===================="

test_case "Feature: Pix aceito" "grep -q \"'pix'\" src/services/paymentService.ts"
test_case "Feature: Cartão aceito" "grep -q \"'credit_card'\" src/services/paymentService.ts"
test_case "Feature: Transferência bancária aceita" "grep -q \"'bank_transfer'\" src/services/paymentService.ts"

# ===== TESTES DE DOCUMENTAÇÃO =====
echo -e "${YELLOW}📚 Testes de Documentação${NC}"
echo "========================="

test_case "Documentação de Pagamentos" "[ -f PAGAMENTOS_LICENCIAMENTO.md ]"
test_case "Documentação de Backend" "[ -f BACKEND_PAGAMENTOS.md ]"
test_case "Configuração de Environment" "[ -f .ENV.PAYMENTS.md ]"

# ===== TESTES DE COMPILAÇÃO =====
echo -e "${YELLOW}🔨 Testes de Compilação${NC}"
echo "====================="

echo "Verificando TypeScript..."
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Compilação bem-sucedida${NC}\n"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ Falha na compilação${NC}\n"
  ((TESTS_FAILED++))
fi

# ===== RESUMO =====
echo ""
echo -e "${YELLOW}📊 RESUMO DOS TESTES${NC}"
echo "===================="
echo -e "${GREEN}✓ Aprovados: $TESTS_PASSED${NC}"
echo -e "${RED}✗ Reprovados: $TESTS_FAILED${NC}"

TOTAL=$((TESTS_PASSED + TESTS_FAILED))
PERCENTAGE=$((TESTS_PASSED * 100 / TOTAL))

echo -e "\nTaxa de Sucesso: ${PERCENTAGE}%"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "\n${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
  exit 0
else
  echo -e "\n${RED}⚠️  ALGums testes falharam${NC}"
  exit 1
fi
