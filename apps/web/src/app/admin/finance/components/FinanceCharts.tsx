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
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { formatCurrencyIDR } from './FinanceOverviewCards';

interface InvoiceData {
  status: string;
  total: number;
  paidAt: string | Date | null;
  amountPaid?: number | null;
  dpAt?: string | Date | null;
  createdAt?: string | Date | null;
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
  bothPayoutsForCompanyRevenue: boolean;
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

// Custom tooltip — soft surface, generous radius, hairline border, tabular nums.
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border/80 px-4 py-3 rounded-2xl shadow-2xl shadow-black/5 min-w-[180px]">
        <p className="text-[10px] uppercase text-muted-foreground tracking-[0.12em] font-medium mb-2.5">
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((item, i: number) => (
            <div key={i} className="flex items-center gap-5 justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="text-xs font-semibold text-foreground tabular-nums">
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

const formatCompactIDR = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
};

export const FinanceCharts: React.FC<FinanceChartsProps> = ({
  invoices,
  expenses,
  treasury,
  payoutsFredrick,
  payoutsNicholas,
  bothPayoutsForCompanyRevenue,
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
      // Aggregate paid and partially paid invoices in this month & year
      const monthlyRevenue = invoices
        .filter(inv => {
          const isPaid = inv.status === 'paid';
          const isPartiallyPaid = inv.status === 'partially_paid';
          if (!isPaid && !isPartiallyPaid) return false;
          
          const dateToUse = isPaid 
            ? (inv.paidAt || inv.dpAt || inv.createdAt)
            : (inv.dpAt || inv.createdAt);
            
          if (!dateToUse) return false;
          const paidDate = new Date(dateToUse);
          return paidDate.getMonth() === config.monthIndex && paidDate.getFullYear() === config.year;
        })
        .reduce((sum, inv) => {
          if (inv.status === 'paid') return sum + inv.total;
          return sum + (inv.amountPaid || 0);
        }, 0);

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
  const retainedEarnings = bothPayoutsForCompanyRevenue
    ? Math.max(0, treasury - (payoutsFredrick + payoutsNicholas))
    : treasury;

  const pieData = [
    { name: 'Retained Earnings (Treasury)', value: retainedEarnings, color: 'var(--primary)' },
    { name: 'Fredrick Draws', value: payoutsFredrick, color: '#38bdf8' },
    { name: 'Nicholas Draws', value: payoutsNicholas, color: '#60a5fa' },
  ];

  const totalAllocation = bothPayoutsForCompanyRevenue
    ? treasury
    : (treasury + payoutsFredrick + payoutsNicholas);
  const totalRevenue = chartData.reduce((s, d) => s + d.Revenue, 0);
  const totalExpenses = chartData.reduce((s, d) => s + d.Expenses, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Cash flow — 2/3 wide ── */}
      <div className="relative rounded-3xl bg-card border border-border/70 p-7 overflow-hidden lg:col-span-2 flex flex-col min-h-[400px]">
        {/* Decorative lime glow behind the chart */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="flex items-start justify-between gap-6 relative">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Cash flow
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Last 6 months · revenue vs. expenses
            </p>
          </div>
          <div className="flex items-center gap-6 text-right">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Revenue</p>
              <p className="text-sm font-semibold text-foreground tabular-nums mt-0.5">
                Rp {formatCompactIDR(totalRevenue)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Expenses</p>
              <p className="text-sm font-semibold text-foreground tabular-nums mt-0.5">
                Rp {formatCompactIDR(totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full flex-1 mt-6 relative -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -8, bottom: 4 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="var(--border)" opacity={0.6} />
              <XAxis
                dataKey="month"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={value => `Rp ${formatCompactIDR(value)}`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="Revenue"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#colorRevenue)"
                fillOpacity={1}
                name="Revenue"
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)', fill: 'var(--primary)' }}
              />
              <Area
                type="monotone"
                dataKey="Expenses"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#colorExpenses)"
                fillOpacity={1}
                name="Expenses"
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)', fill: '#ef4444' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Treasury allocation — 1/3 wide ── */}
      <div className="relative rounded-3xl bg-card border border-border/70 p-7 overflow-hidden flex flex-col min-h-[400px]">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Treasury allocation
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Retained vs. partner draws
          </p>
        </div>

        {/* Donut chart with centered total */}
        <div className="w-full flex-1 mt-4 relative flex items-center justify-center min-h-[180px]">
          {totalAllocation > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={92}
                    paddingAngle={3}
                    cornerRadius={10}
                    dataKey="value"
                    strokeWidth={0}
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
                      borderRadius: '16px',
                      fontSize: '11px',
                      padding: '10px 14px',
                      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Total</p>
                <p className="text-base font-semibold text-foreground tabular-nums mt-0.5">
                  Rp {formatCompactIDR(totalAllocation)}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center p-4">
              <p className="text-xs text-muted-foreground">No ledger data yet</p>
            </div>
          )}
        </div>

        {/* Legend list */}
        <div className="space-y-2.5 mt-5 pt-5 border-t border-border/60">
          {pieData.map((item, idx) => {
            const pct = totalAllocation > 0 ? Math.round((item.value / totalAllocation) * 100) : 0;
            return (
              <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-foreground font-semibold tabular-nums">{pct}%</span>
                  <span className="text-muted-foreground tabular-nums text-[11px]">
                    Rp {formatCompactIDR(item.value)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
