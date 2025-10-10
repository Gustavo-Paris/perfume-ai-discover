# Arquitetura de Dashboards - Sistema de Analytics

## Visão Geral

Sistema completo de dashboards analíticos para administração do negócio, com métricas em tempo real e análises avançadas.

## Estrutura de Dashboards

### 1. **Overview Dashboard** (Principal)
**Arquivo:** `src/pages/admin/AdminDashboard.tsx`
- Visão geral executiva do negócio
- KPIs principais: pedidos, receita, ticket médio, conversão
- Métricas secundárias: usuários, produtos, pontos, wishlist
- Gráfico de vendas (30 dias)
- Funil de conversão
- Produtos mais desejados

### 2. **Financial Dashboard** 
**Arquivo:** `src/components/admin/dashboards/FinancialDashboard.tsx`
- Métricas de receita e lucratividade
- Análise de fluxo de caixa
- Categorização de despesas
- Comparação mensal (MoM)
- Análise por método de pagamento
- Lucro por categoria de produto

**RPC Functions:**
- `get_revenue_metrics(p_days)`
- `get_expense_categories(p_days)`
- `get_cash_flow_analysis(p_days)`
- `get_payment_method_analysis(p_days)`
- `get_profit_by_category(p_days)`
- `get_monthly_comparison()`

### 3. **Orders Dashboard**
**Arquivo:** `src/components/admin/dashboards/OrdersDashboard.tsx`
- Visão geral de pedidos (total, pendentes, concluídos, cancelados)
- Receita total e métricas de fulfillment
- Timeline de pedidos por período
- Distribuição por status
- Métricas de processamento e entrega
- Top clientes

**RPC Functions:**
- `get_orders_overview(p_days)`
- `get_orders_by_status(p_days)`
- `get_orders_by_period(p_days)`
- `get_top_customers(p_limit)`
- `get_order_fulfillment_metrics(p_days)`

### 4. **Inventory Dashboard**
**Arquivo:** `src/components/admin/dashboards/InventoryDashboard.tsx`
- Total de produtos e estoque
- Produtos com estoque baixo/esgotado
- Valor total do inventário
- Movimentações de estoque (entradas/saídas)
- Giro de estoque (turnover)
- Lotes com validade próxima

**RPC Functions:**
- `get_inventory_overview()`
- `get_stock_levels()`
- `get_stock_movements(p_days)`
- `get_inventory_turnover(p_days)`
- `get_lot_expirations()`

### 5. **Marketing Dashboard**
**Arquivo:** `src/components/admin/dashboards/MarketingDashboard.tsx`
- Cupons ativos e descontos concedidos
- ROI médio de cupons
- Taxa de conversão de cupons
- Top cupons por ROI, receita e uso
- Análise de abandono de carrinho
- CAC (Custo de Aquisição de Cliente) por cupom
- Tendências mensais

**Data Sources:**
- View `coupon_metrics`
- Tabela `coupon_redemptions`
- Hooks: `useMarketingMetrics`, `useCouponAnalytics`

### 6. **Products Dashboard**
**Arquivo:** `src/components/admin/dashboards/ProductsDashboard.tsx`
- Top produtos por receita, quantidade e margem
- Análise de cross-sell (produtos comprados juntos)
- Classificação ABC dos produtos
- Matriz BCG (Star, Cash Cow, Question Mark, Dog)
- Produtos sem vendas (dead products)
- Performance geral de produtos

**RPC Functions:**
- `get_top_products_by_revenue(p_limit)`
- `get_top_products_by_quantity(p_limit)`
- `get_top_products_by_margin(p_limit)`
- `get_cross_sell_products(p_limit)`
- `get_abc_classification()`
- `get_bcg_matrix()`
- `get_product_performance()`
- `get_dead_products(p_days)`

### 7. **Performance Dashboard**
**Arquivo:** `src/components/admin/dashboards/PerformanceDashboard.tsx`
- Métricas de performance do sistema
- Tempo de resposta
- Taxa de erro
- Utilização de recursos

### 8. **Analytics Dashboard**
**Arquivo:** `src/components/admin/dashboards/AnalyticsDashboard.tsx`
- Analytics de comportamento de usuários
- Páginas mais visitadas
- Sessões e engajamento
- Métricas de retenção

## Arquitetura de Dados

### Hooks Customizados

#### Financial Analytics
- `src/hooks/useFinancialAnalytics.ts`
  - `useRevenueMetrics(days)`
  - `useExpenseCategories(days)`
  - `useCashFlowAnalysis(days)`
  - `usePaymentMethodAnalysis(days)`
  - `useProfitByCategory(days)`
  - `useMonthlyComparison()`

#### Orders Analytics
- `src/hooks/useOrdersAnalytics.ts`
  - `useOrdersOverview(days)`
  - `useOrdersByStatus(days)`
  - `useOrdersByPeriod(days)`
  - `useTopCustomers(limit)`
  - `useOrderFulfillmentMetrics(days)`

#### Inventory Analytics
- `src/hooks/useInventoryAnalytics.ts`
  - `useInventoryOverview()`
  - `useStockLevels()`
  - `useStockMovements(days)`
  - `useInventoryTurnover(days)`
  - `useLotExpirations()`

#### Product Analytics
- `src/hooks/useProductAnalytics.ts`
  - `useTopProductsByRevenue(limit)`
  - `useTopProductsByQuantity(limit)`
  - `useTopProductsByMargin(limit)`
  - `useCrossSellAnalysis(limit)`
  - `useABCAnalysis()`
  - `useBCGMatrix()`
  - `useProductPerformance()`
  - `useDeadProducts(days)`

#### Marketing Analytics
- `src/hooks/useMarketingMetrics.ts`
  - `useMarketingMetrics(dateRange?)`
  - `useMarketingTrends(monthsBack)`
  - `useCACByCoupon()`

- `src/hooks/useCouponAnalytics.ts`
  - `useTopCouponsByROI(limit)`
  - `useTopCouponsByRevenue(limit)`
  - `useTopCouponsByUsage(limit)`
  - `useCouponConversionRates()`
  - `useCouponAbandonmentAnalysis()`

### Types

#### Orders Analytics
`src/types/ordersAnalytics.ts`
- `OrdersOverview`
- `OrdersByStatus`
- `OrdersByPeriod`
- `TopCustomers`
- `OrderFulfillmentMetrics`

#### Inventory Analytics
`src/types/inventoryAnalytics.ts`
- `InventoryOverview`
- `StockLevels`
- `StockMovements`
- `InventoryTurnover`
- `LotExpiration`

#### Product Analytics
`src/types/productAnalytics.ts`
- `ProductSalesData`
- `CrossSellData`
- `ABCClassification`
- `BCGMatrix`
- `ProductPerformance`

#### Marketing Analytics
`src/types/marketingAnalytics.ts`
- `MarketingMetrics`
- `CouponMetric`
- `CouponRoiData`

#### Financial Analytics
`src/types/financialAnalytics.ts`
- Tipos para métricas financeiras

## Componentes Compartilhados

### DashboardSelector
**Arquivo:** `src/components/admin/DashboardSelector.tsx`
- Seletor universal de dashboards
- 8 opções de dashboards
- Ícones e labels consistentes

### StatCard (Padrão)
Componente reutilizável para cards de métricas com:
- Título e valor
- Ícone com gradiente
- Subtítulo
- Indicador de tendência (opcional)
- Efeito hover

## Fluxo de Dados

```
Dashboard Component
    ↓
Custom Hook (React Query)
    ↓
Supabase RPC Function
    ↓
PostgreSQL Database
    ↓
Retorno através do hook
    ↓
Renderização no Dashboard
```

## Performance

- **Caching:** React Query com staleTime configurado
- **Parallel Queries:** Múltiplas queries executadas em paralelo
- **Memoization:** useMemo e useCallback onde apropriado
- **Lazy Loading:** Componentes carregados sob demanda

## Segurança

- **RLS Policies:** Todas as funções RPC com SECURITY DEFINER
- **Search Path:** SET search_path = public em todas as funções
- **Admin Only:** Dashboards acessíveis apenas para usuários admin

## Próximos Passos

1. ✅ Implementar todos os dashboards principais
2. ✅ Criar funções RPC otimizadas
3. ✅ Integrar com componente principal
4. 🔄 Testes de performance
5. 🔄 Adicionar mais filtros de data
6. 🔄 Exportação de relatórios (PDF/Excel)
7. 🔄 Dashboards personalizáveis por usuário
8. 🔄 Alertas automáticos baseados em métricas

## Manutenção

### Adicionando Novo Dashboard

1. Criar componente em `src/components/admin/dashboards/`
2. Criar tipos em `src/types/`
3. Criar hooks em `src/hooks/`
4. Criar funções RPC no banco de dados
5. Adicionar ao DashboardSelector
6. Integrar no AdminDashboard.tsx

### Modificando Métricas Existentes

1. Atualizar função RPC no banco
2. Atualizar tipos TypeScript
3. Atualizar hook se necessário
4. Atualizar componente de dashboard
