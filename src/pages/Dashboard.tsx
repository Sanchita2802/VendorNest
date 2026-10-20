import React, { useEffect, useState } from 'react';
import {
  Building2,
  Package,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import { ClayCard } from '../components/common/ClayCard';
import { ClayButton } from '../components/common/ClayButton';
import { ClayChip } from '../components/common/ClayChip';
import { ConceptTooltip } from '../components/common/ConceptTooltip';
import { db } from '../db/db';
import { fetchProcurementInsights, ProcurementInsightResponse } from '../services/ai';
import { useToast } from '../components/common/ClayToast';
import { useTheme } from '../theme/ThemeContext';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { resolvedTheme, aiEnabled } = useTheme();
  const { showToast } = useToast();
  const isDark = resolvedTheme === 'dark';

  const [vendors, setVendors] = useState(db.getVendors());
  const [products, setProducts] = useState(db.getProducts());
  const [orders, setOrders] = useState(db.getPurchaseOrders());
  const [payments, setPayments] = useState(db.getPayments());

  const [aiInsights, setAiInsights] = useState<ProcurementInsightResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setVendors(db.getVendors());
      setProducts(db.getProducts());
      setOrders(db.getPurchaseOrders());
      setPayments(db.getPayments());
    });
    return () => unsubscribe();
  }, []);

  // Stats calculation
  const totalVendors = vendors.length;
  const totalGoods = products.filter((p) => p.Type === 'Goods').length;
  const totalServices = products.filter((p) => p.Type === 'Service').length;

  const pendingOrders = orders.filter((o) => o.Status === 'Pending');
  const deliveredOrders = orders.filter((o) => o.Status === 'Delivered');

  const paidPayments = payments.filter((p) => p.Status === 'Paid');
  const pendingPayments = payments.filter((p) => p.Status === 'Pending');

  const totalPaidAmount = payments.reduce((sum, p) => sum + p.InstallmentsSum, 0);
  const totalOrderValue = orders.reduce((sum, o) => sum + o.TotalCost, 0);
  const totalOutstandingAmount = Math.max(0, totalOrderValue - totalPaidAmount);

  // Currency Formatter
  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // Category chart data
  const categoryMap: { [cat: string]: number } = {};
  vendors.forEach((v) => {
    categoryMap[v.Category] = (categoryMap[v.Category] || 0) + 1;
  });
  const categoryChartData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // PO Value per vendor data (derived TotalCost)
  const poValuePerVendor = vendors
    .map((v) => {
      const vOrders = orders.filter((o) => o.VendorID === v.VendorID);
      const val = vOrders.reduce((sum, o) => sum + o.TotalCost, 0);
      return {
        name: v.VendorName.length > 14 ? v.VendorName.substring(0, 14) + '...' : v.VendorName,
        value: val,
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Order status chart data
  const orderStatusData = [
    { name: 'Delivered', value: deliveredOrders.length, color: '#7BE0A8' },
    { name: 'Pending', value: pendingOrders.length, color: '#FFD97A' },
  ];

  // Payments timeline data
  const paymentsTimeline = [...payments]
    .sort((a, b) => new Date(a.PaymentDate).getTime() - new Date(b.PaymentDate).getTime())
    .map((p) => ({
      date: p.PaymentDate,
      amount: p.Amount,
      paid: p.InstallmentsSum,
    }));

  // "Needs attention" list:
  // 1. Pending orders
  // 2. Pending payments
  // 3. Vendors with no products
  const vendorsWithoutProducts = vendors.filter((v) => v.ProductCount === 0);

  // Fetch AI Insights
  const handleLoadInsights = async () => {
    if (!aiEnabled) {
      showToast({
        type: 'info',
        title: 'AI is Disabled',
        message: 'Enable Gemini AI in Settings to generate procurement insights.',
      });
      return;
    }
    setLoadingAi(true);
    const summary = {
      totalVendors,
      totalGoods,
      totalServices,
      pendingOrdersCount: pendingOrders.length,
      deliveredOrdersCount: deliveredOrders.length,
      totalOrderValue,
      totalPaidAmount,
      totalOutstandingAmount,
      topVendorsByBilled: poValuePerVendor.slice(0, 3),
      pendingPaymentsCount: pendingPayments.length,
    };

    const res = await fetchProcurementInsights(summary);
    setLoadingAi(false);
    if (res) {
      setAiInsights(res);
      showToast({
        type: 'success',
        title: 'Insights Updated',
        message: 'Gemini evaluated current procurement and payment health.',
      });
    } else {
      showToast({
        type: 'warning',
        title: 'AI Unavailable',
        message: 'Displaying standard analytical rules for procurement management.',
      });
      setAiInsights({
        insights: [
          `Category distribution shows ${categoryChartData.length} active sectors with healthy supplier diversification.`,
          `${pendingOrders.length} orders remain in 'Pending' status and require supplier fulfillment follow-ups.`,
          `Current outstanding balance stands at ${formatINR(totalOutstandingAmount)} across scheduled milestones.`,
        ],
        recommendation:
          'Prioritize closing pending deliveries for orders created over 7 days ago to release pending installments.',
      });
    }
  };

  useEffect(() => {
    handleLoadInsights();
  }, []);

  const COLORS = ['#7C83FD', '#5ED6B0', '#FFAB91', '#7CC6FE', '#FFD97A', '#FF8FB1'];

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[var(--text-primary)]">
              Procurement Dashboard
            </h1>
            <ConceptTooltip
              concept="Derived Metrics & Relational Aggregation"
              explanation="All KPI totals, outstanding amounts, and order costs are derived dynamically through relational JOIN and SUM aggregates without duplicate stored columns."
              rule="Derived TotalCost = SUM(Product.Price * Contains.Quantity)"
            />
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Real-time analytics across all 10 normalized tables in the relational store.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ClayButton
            variant="secondary"
            size="sm"
            onClick={handleLoadInsights}
            loading={loadingAi}
            icon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
          >
            Refresh AI Insight
          </ClayButton>
        </div>
      </div>

      {/* 4 CLAY STAT CARDS WITH COUNT-UP / DETAIL METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Total Vendors */}
        <ClayCard
          onClick={() => onNavigate('vendors')}
          className="cursor-pointer hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-heading font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Total Vendors
            </span>
            <div className="p-2 rounded-2xl bg-indigo-500/15 text-[var(--accent-primary)]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-3xl text-[var(--text-primary)]">
            {totalVendors}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center justify-between">
            <span>Decomposed with 3NF Pincodes</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          </p>
        </ClayCard>

        {/* Stat 2: Total Products (split Goods vs Service) */}
        <ClayCard
          onClick={() => onNavigate('products')}
          className="cursor-pointer hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-heading font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Product Catalog
            </span>
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-500">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-3xl text-[var(--text-primary)]">
            {products.length}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              {totalGoods} Goods
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold font-mono">
              {totalServices} Services
            </span>
          </div>
        </ClayCard>

        {/* Stat 3: Orders (Pending vs Delivered) */}
        <ClayCard
          onClick={() => onNavigate('orders')}
          className="cursor-pointer hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-heading font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Purchase Orders
            </span>
            <div className="p-2 rounded-2xl bg-amber-500/15 text-amber-500">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-3xl text-[var(--text-primary)]">
            {orders.length}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-[#7BE0A8]/30 text-[#0B4628] dark:text-[#A8F0C6] font-semibold">
              {deliveredOrders.length} Delivered
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#FFD97A]/40 text-[#614700] dark:text-[#FFE699] font-semibold">
              {pendingOrders.length} Pending
            </span>
          </div>
        </ClayCard>

        {/* Stat 4: Payments (Paid vs Pending & INR) */}
        <ClayCard
          onClick={() => onNavigate('payments')}
          className="cursor-pointer hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-heading font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Payments & Dues
            </span>
            <div className="p-2 rounded-2xl bg-rose-500/15 text-rose-500">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl text-[var(--text-primary)] truncate">
            {formatINR(totalPaidAmount)}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center justify-between">
            <span className="text-rose-500 font-medium">Due: {formatINR(totalOutstandingAmount)}</span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              {paidPayments.length} Paid / {pendingPayments.length} Pend
            </span>
          </p>
        </ClayCard>
      </div>

      {/* AI PROCUREMENT INSIGHT CARD */}
      <ClayCard elevated className="border border-[var(--accent-primary)]/25 relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                  AI Procurement Insight
                </h3>
                <ClayChip label="✨ Gemini AI" variant="primary" />
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Autonomous relational database auditing & procurement recommendations
              </p>
            </div>
          </div>

          <ClayButton
            variant="ghost"
            size="sm"
            onClick={handleLoadInsights}
            loading={loadingAi}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Regenerate
          </ClayButton>
        </div>

        {loadingAi ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
            <span>Analyzing relational trends, order bottlenecks, and cash flows...</span>
          </div>
        ) : aiInsights ? (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiInsights.insights.map((ins, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--text-muted)]/15 text-xs text-[var(--text-primary)] leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{ins}</span>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[var(--surface-sunken)] to-emerald-500/10 border border-amber-500/30 text-xs flex items-start gap-2.5">
              <TrendingUp className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-heading font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                  Recommended Procurement Action:
                </span>
                <span className="text-[var(--text-primary)] leading-relaxed">
                  {aiInsights.recommendation}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </ClayCard>

      {/* CHARTS GRID (RECHARTS CLAY-STYLED) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Vendors by Category (Donut) */}
        <ClayCard className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                Vendors by Category
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Supplier industry concentration</p>
            </div>
            <ClayChip label={`${categoryChartData.length} Sectors`} variant="secondary" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1B1E3D' : '#FFFFFF',
                    borderRadius: '16px',
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: isDark ? '#F2F4FF' : '#1B2140',
                    fontSize: '12px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {categoryChartData.map((item, idx) => (
              <span key={item.name} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span>
                  {item.name} ({item.value})
                </span>
              </span>
            ))}
          </div>
        </ClayCard>

        {/* Chart 2: Purchase Order Value per Vendor (Bar Chart) */}
        <ClayCard className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                PO Value per Vendor
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Calculated using derived TotalCost (₹)
              </p>
            </div>
            <ClayChip label="Derived SUM" variant="derived" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={poValuePerVendor} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: isDark ? '#C5CAEC' : '#4A5272' }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#C5CAEC' : '#4A5272' }} />
                <Tooltip
                  formatter={(val: any) => formatINR(Number(val))}
                  contentStyle={{
                    backgroundColor: isDark ? '#1B1E3D' : '#FFFFFF',
                    borderRadius: '16px',
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: isDark ? '#F2F4FF' : '#1B2140',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#7C83FD" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ClayCard>

        {/* Chart 3: Orders by Status (Donut) */}
        <ClayCard className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                Fulfillment Status
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Delivered vs Pending orders</p>
            </div>
            <ClayChip label={`${orders.length} Total`} variant="secondary" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`status-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1B1E3D' : '#FFFFFF',
                    borderRadius: '16px',
                    color: isDark ? '#F2F4FF' : '#1B2140',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-[#7BE0A8]" />
              <span className="font-heading font-semibold text-[var(--text-primary)]">
                Delivered ({deliveredOrders.length})
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-[#FFD97A]" />
              <span className="font-heading font-semibold text-[var(--text-primary)]">
                Pending ({pendingOrders.length})
              </span>
            </div>
          </div>
        </ClayCard>

        {/* Chart 4: Payment Disbursements Over Time (Area Chart) */}
        <ClayCard className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                Payments Chronology
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Disbursed vs Total Amount</p>
            </div>
            <ClayChip label="Timeline" variant="secondary" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={paymentsTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5ED6B0" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#5ED6B0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDark ? '#C5CAEC' : '#4A5272' }} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#C5CAEC' : '#4A5272' }} />
                <Tooltip
                  formatter={(val: any) => formatINR(Number(val))}
                  contentStyle={{
                    backgroundColor: isDark ? '#1B1E3D' : '#FFFFFF',
                    borderRadius: '16px',
                    color: isDark ? '#F2F4FF' : '#1B2140',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="paid" stroke="#5ED6B0" strokeWidth={2} fill="url(#paidGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ClayCard>
      </div>

      {/* RECENT ACTIVITY & NEEDS ATTENTION SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Attention */}
        <ClayCard>
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
              Needs Attention ({pendingOrders.length + pendingPayments.length + vendorsWithoutProducts.length})
            </h3>
          </div>

          <div className="space-y-3">
            {pendingOrders.map((o) => (
              <div
                key={o.OrderID}
                onClick={() => onNavigate('orders')}
                className="p-3 rounded-2xl bg-[var(--surface-sunken)] hover:bg-[var(--surface)] cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-heading font-bold text-[var(--text-primary)]">{o.OrderID}</span>
                    <span className="text-[var(--text-muted)] ml-2">to {o.VendorName}</span>
                    <p className="text-[11px] text-[var(--text-secondary)]">Ordered on {o.OrderDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {formatINR(o.TotalCost)}
                  </span>
                  <ClayChip label="Pending" variant="pending" className="block mt-0.5 text-[10px]" />
                </div>
              </div>
            ))}

            {pendingPayments.map((p) => (
              <div
                key={p.PaymentID}
                onClick={() => onNavigate('payments')}
                className="p-3 rounded-2xl bg-[var(--surface-sunken)] hover:bg-[var(--surface)] cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <span className="font-heading font-bold text-[var(--text-primary)]">{p.PaymentID}</span>
                    <span className="text-[var(--text-muted)] ml-2">Order {p.OrderID}</span>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Due: {formatINR(p.RemainingBalance)}
                    </p>
                  </div>
                </div>
                <ClayChip label="Pending Due" variant="error" className="text-[10px]" />
              </div>
            ))}

            {vendorsWithoutProducts.map((v) => (
              <div
                key={v.VendorID}
                onClick={() => onNavigate('products')}
                className="p-3 rounded-2xl bg-[var(--surface-sunken)] hover:bg-[var(--surface)] cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <span className="font-heading font-bold text-[var(--text-primary)]">{v.VendorName}</span>
                    <p className="text-[11px] text-[var(--text-muted)]">No catalog items assigned yet</p>
                  </div>
                </div>
                <span className="text-xs font-heading font-bold text-[var(--accent-primary)] hover:underline">
                  Add Product →
                </span>
              </div>
            ))}

            {pendingOrders.length === 0 && pendingPayments.length === 0 && vendorsWithoutProducts.length === 0 && (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                All purchase orders fulfilled and all vendor balances satisfied!
              </div>
            )}
          </div>
        </ClayCard>

        {/* Recent Activity List */}
        <ClayCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
              Latest Procurements
            </h3>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-heading font-semibold text-[var(--accent-primary)] hover:underline"
            >
              View all orders →
            </button>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 5).map((o) => (
              <div
                key={o.OrderID}
                onClick={() => onNavigate('orders')}
                className="p-3 rounded-2xl bg-[var(--surface-sunken)] hover:bg-[var(--surface)] cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-[var(--text-primary)]">{o.OrderID}</span>
                    <ClayChip
                      label={o.Status}
                      variant={o.Status === 'Delivered' ? 'delivered' : 'pending'}
                      className="text-[10px]"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    {o.VendorName} • {o.Items.length} item(s)
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {formatINR(o.TotalCost)}
                  </span>
                  <span className="block text-[10px] text-[var(--text-muted)]">{o.OrderDate}</span>
                </div>
              </div>
            ))}
          </div>
        </ClayCard>
      </div>
    </div>
  );
};
