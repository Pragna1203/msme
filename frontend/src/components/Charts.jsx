import React from 'react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell,
  PieChart, Pie,
  Legend,
} from 'recharts';

// ─── Shared colour palette ───────────────────────────────────────────────────
const PURPLE = '#a855f7';
const GREEN  = '#22c55e';
const BLUE   = '#3b82f6';
const ORANGE = '#f97316';
const PINK   = '#ec4899';

// ─── Dummy data (replaces live data if backend returns nothing) ───────────────
export const salesTrendData = [
  { month: 'Jan', sales: 42000 },
  { month: 'Feb', sales: 55000 },
  { month: 'Mar', sales: 48000 },
  { month: 'Apr', sales: 61000 },
  { month: 'May', sales: 73000 },
  { month: 'Jun', sales: 68000 },
  { month: 'Jul', sales: 82000 },
  { month: 'Aug', sales: 91000 },
  { month: 'Sep', sales: 77000 },
  { month: 'Oct', sales: 95000 },
  { month: 'Nov', sales: 109000 },
  { month: 'Dec', sales: 124000 },
];

export const topProductsData = [
  { name: 'Laptops',        sales: 124000 },
  { name: 'Smartphones',   sales: 98000  },
  { name: 'Office Chairs', sales: 72000  },
  { name: 'Headphones',    sales: 61000  },
  { name: 'Monitors',      sales: 48000  },
];

export const expenseCategoriesData = [
  { name: 'Technology',      value: 45 },
  { name: 'Office Supplies', value: 30 },
  { name: 'Furniture',       value: 25 },
];

export const yearlyProfitData = [
  { year: '2021', profit: 38000 },
  { year: '2022', profit: 52000 },
  { year: '2023', profit: 67000 },
  { year: '2024', profit: 84000 },
  { year: '2025', profit: 97000 },
];

// ─── Custom tooltip style ─────────────────────────────────────────────────────
const TooltipStyle = {
  background: 'rgba(15,23,42,0.85)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '10px',
  color: '#f1f5f9',
  fontSize: '13px',
  padding: '10px 14px',
};

const CustomTooltip = ({ active, payload, label, prefix = '₹' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={TooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#a855f7' }}>
          {p.name}: {prefix}{Number(p.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
};

// ─── PIE custom label ─────────────────────────────────────────────────────────
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── A) Sales Trend Line Chart ────────────────────────────────────────────────
export const SalesTrendChart = ({ data = salesTrendData }) => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={PURPLE} stopOpacity={0.35} />
          <stop offset="95%" stopColor={PURPLE} stopOpacity={0}    />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
      <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
      <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
      <Tooltip content={<CustomTooltip />} />
      <Area type="monotone" dataKey="sales" name="Sales" stroke={PURPLE} strokeWidth={2.5}
        fill="url(#salesGrad)" dot={false} activeDot={{ r: 5, fill: PURPLE }} />
    </AreaChart>
  </ResponsiveContainer>
);

// ─── B) Top Products Horizontal Bar ──────────────────────────────────────────
const BAR_COLORS = [GREEN, BLUE, PURPLE, ORANGE, PINK];

export const TopProductsChart = ({ data = topProductsData }) => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
      <XAxis type="number" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}
        tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
      <YAxis type="category" dataKey="name" width={90}
        tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={false} tickLine={false} />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="sales" name="Sales" radius={[0, 8, 8, 0]} maxBarSize={18}>
        {data.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

// ─── C) Expense Categories Donut ──────────────────────────────────────────────
const PIE_COLORS = [BLUE, ORANGE, GREEN];

export const ExpenseDonutChart = ({ data = expenseCategoriesData }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <defs>
            {PIE_COLORS.map((c, i) => (
              <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"   stopColor={c} stopOpacity={1}   />
                <stop offset="100%" stopColor={c} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <Pie data={data} cx="50%" cy="50%" innerRadius={58} outerRadius={82}
            paddingAngle={4} dataKey="value" labelLine={false} label={renderCustomLabel}>
            {data.map((_, i) => <Cell key={i} fill={`url(#pieGrad${i})`} />)}
          </Pie>
          <Legend iconType="circle" iconSize={8}
            formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
          <Tooltip formatter={(v) => [`${v}%`, 'Share']} contentStyle={TooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      {/* centre label */}
      <div style={{
        position: 'absolute', top: '44%', left: '50%',
        transform: 'translate(-50%,-50%)', textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{total}%</div>
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>Total</div>
      </div>
    </div>
  );
};

// ─── D) Yearly Profit Bar Chart ───────────────────────────────────────────────
export const YearlyProfitChart = ({ data = yearlyProfitData }) => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={GREEN} stopOpacity={1}   />
          <stop offset="100%" stopColor={GREEN} stopOpacity={0.4} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
      <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
      <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="profit" name="Profit" fill="url(#profitGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
    </BarChart>
  </ResponsiveContainer>
);
