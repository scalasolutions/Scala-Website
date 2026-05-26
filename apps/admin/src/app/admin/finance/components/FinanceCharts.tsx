'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { formatCurrencyIDR } from './FinanceOverviewCards';

interface InvoiceData {
  status: string;
  total: number;
  paidAt: string | Date | null;
}

interface ExpenseData {
  amount: number;
  date: string | Date;
}

interface FinanceChartsProps {
  invoices: InvoiceData[];
  expenses: ExpenseData[];
  treasury: number;
  payoutsFredrick: number;
  payoutsNicholas: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  label?: string | number;
}

// Custom tooltips styling for both charts declared as a static component to satisfy react-hooks/static-components
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3.5 rounded-2xl shadow-xl z-30">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">
          Ledger for {label}
        </p>
        <div className="space-y-1">
          {payload.map((item, i: number) => (
            <div key={i} className="flex items-center gap-6 justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}:
              </span>
              <span className="text-xs font-black text-foreground font-mono">
                {item.value !== undefined ? formatCurrencyIDR(Number(item.value)) : 'Rp 0'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const FinanceCharts: React.FC<FinanceChartsProps> = ({
  invoices,
  expenses,
  treasury,
  payoutsFredrick,
  payoutsNicholas,
}) => {
  // 1. DYNAMICALLY GENERATE LAST 6 MONTHS CHART DATA
  const getChartData = () => {
    const currentYear = 2026;
    
    // Month mapping index (Dec = 11 of year 2025, Jan = 0 of year 2026, etc.)
    const monthConfigs = [
      { name: 'Dec', monthIndex: 11, year: currentYear - 1 },
      { name: 'Jan', monthIndex: 0, year: currentYear },
      { name: 'Feb', monthIndex: 1, year: currentYear },
      { name: 'Mar', monthIndex: 2, year: currentYear },
      { name: 'Apr', monthIndex: 3, year: currentYear },
      { name: 'May', monthIndex: 4, year: currentYear },
    ];

    return monthConfigs.map(config => {
      // Aggregate paid invoices in this month & year
      const monthlyRevenue = invoices
        .filter(inv => {
          if (inv.status !== 'paid' || !inv.paidAt) return false;
          const paidDate = new Date(inv.paidAt);
          return paidDate.getMonth() === config.monthIndex && paidDate.getFullYear() === config.year;
        })
        .reduce((sum, inv) => sum + inv.total, 0);

      // Aggregate expenses in this month & year
      const monthlyExpenses = expenses
        .filter(exp => {
          const expDate = new Date(exp.date);
          return expDate.getMonth() === config.monthIndex && expDate.getFullYear() === config.year;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);

      return {
        month: config.name,
        Revenue: monthlyRevenue,
        Expenses: monthlyExpenses,
        Profit: Math.max(0, monthlyRevenue - monthlyExpenses),
      };
    });
  };

  const chartData = getChartData();

  // 2. PIE CHART DATA (Treasury vs. Draws Allocation)
  const pieData = [
    { name: 'Retained Earnings (Treasury)', value: treasury, color: 'var(--primary)' },
    { name: 'Fredrick Draws', value: payoutsFredrick, color: '#38bdf8' },
    { name: 'Nicholas Draws', value: payoutsNicholas, color: '#60a5fa' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Monthly Cash Flow - 2/3 wide */}
      <div className="glow-card relative rounded-2xl bg-card border border-border p-6 shadow-xl overflow-hidden lg:col-span-2 flex flex-col justify-between min-h-[360px]">
        <div>
          <h3 className="font-bold text-sm text-foreground">Cash Flow Visualizer</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Comparison of month-on-month invoice collections vs. business expenses.
          </p>
        </div>

        <div className="w-full h-64 mt-4 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
              <XAxis
                dataKey="month"
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={value => {
                  if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `Rp ${value / 1000}k`;
                  return `Rp ${value}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="Revenue"
                stroke="var(--primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue (Invoiced & Paid)"
              />
              <Area
                type="monotone"
                dataKey="Expenses"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpenses)"
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Capital Distribution Breakdown - 1/3 wide */}
      <div className="glow-card relative rounded-2xl bg-card border border-border p-6 shadow-xl overflow-hidden flex flex-col justify-between min-h-[360px]">
        <div>
          <h3 className="font-bold text-sm text-foreground">Treasury Allocation</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Proportional division of current cash vault vs. partner payouts drawn.
          </p>
        </div>

        {/* Donut Chart or Fallback */}
        <div className="w-full h-48 mt-4 relative flex items-center justify-center">
          {treasury + payoutsFredrick + payoutsNicholas > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => formatCurrencyIDR(Number(value || 0))}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-4">
              <p className="text-xs text-muted-foreground">No ledger data to display allocation ratio.</p>
            </div>
          )}
        </div>

        {/* Legend Indicators */}
        <div className="space-y-2 mt-4">
          {pieData.map((item, idx) => {
            const total = treasury + payoutsFredrick + payoutsNicholas;
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={idx} className="flex items-center justify-between text-[11px] font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground truncate max-w-[140px]">{item.name}</span>
                </div>
                <span className="text-foreground shrink-0">{pct}% ({formatCurrencyIDR(item.value)})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
