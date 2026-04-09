import React, { useRef } from 'react';
import StatsCard from './StatsCard';
import {
  SalesTrendChart,
  TopProductsChart,
  ExpenseDonutChart,
  YearlyProfitChart,
} from './Charts';
import './Dashboard.css';

const Dashboard = ({ metrics, settings }) => {
  const dashboardRef = useRef(null);

  // Dynamic Formatter based on settings
  const currency = settings?.currency || 'INR';
  const locales = {
    'INR': 'en-IN',
    'USD': 'en-US',
    'EUR': 'de-DE'
  };
  
  const formatter = new Intl.NumberFormat(locales[currency] || 'en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  });

  const fmt = (n) => n != null ? formatter.format(n) : formatter.format(0);

  /* KPI values – use real data if backend supplies it, else tasteful defaults */
  const totalRevenue  = metrics?.['Total Sales']  ?? 964000;
  const totalExpenses = metrics?.['Total Expenses'] ?? 412000;
  const netProfit     = metrics?.['Total Profit']  ?? (totalRevenue - totalExpenses);
  const netMargin     = metrics?.['Net Margin']    ?? ((netProfit / totalRevenue) * 100).toFixed(1);


  /* ── CSV export ─────────────────────────────────────────────────────────── */
  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Revenue', totalRevenue],
      ['Total Expenses', totalExpenses],
      ['Net Profit', netProfit],
      ['Net Margin (%)', netMargin],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bizsense_dashboard.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── PNG export via browser print ──────────────────────────────────────── */
  const handleDownloadPNG = () => {
    window.print();
  };

  return (
    <div className="dashboard-root animate-fade-in" ref={dashboardRef}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Business Overview</h2>
          <p className="dash-subtitle">Real-time BizSense AI analytics</p>
        </div>
        <span className="live-badge">● Live</span>
      </div>

      {/* ── KPI Cards row ────────────────────────────────────────────────── */}
      <div className="stats-row">
        <StatsCard
          title="Total Revenue"
          value={fmt(totalRevenue)}
          trend="up"
          trendValue="12.4%"
          color="green"
          icon="💰"
        />
        <StatsCard
          title="Total Expenses"
          value={fmt(totalExpenses)}
          trend="down"
          trendValue="3.1%"
          color="red"
          icon="📉"
        />
        <StatsCard
          title="Net Profit"
          value={fmt(netProfit)}
          trend="up"
          trendValue="18.7%"
          color="purple"
          icon="📈"
        />
        <StatsCard
          title="Net Margin"
          value={`${netMargin}%`}
          trend="up"
          trendValue="2.3%"
          color="blue"
          icon="🎯"
        />
      </div>

      {/* ── Charts grid ──────────────────────────────────────────────────── */}
      <div className="charts-grid">

        {/* Row 1 – Sales trend + Top products */}
        <div className="chart-card chart-card--large">
          <div className="chart-card__header">
            <span className="chart-card__title">Sales Trends</span>
            <span className="chart-card__badge">Monthly</span>
          </div>
          <SalesTrendChart />
        </div>

        <div className="chart-card">
          <div className="chart-card__header">
            <span className="chart-card__title">Top Products</span>
            <span className="chart-card__badge">Top 5</span>
          </div>
          <TopProductsChart />
        </div>

        {/* Row 2 – Expense donut + Yearly profit */}
        <div className="chart-card">
          <div className="chart-card__header">
            <span className="chart-card__title">Expense Categories</span>
            <span className="chart-card__badge">Breakdown</span>
          </div>
          <ExpenseDonutChart />
        </div>

        <div className="chart-card chart-card--large">
          <div className="chart-card__header">
            <span className="chart-card__title">Yearly Profit</span>
            <span className="chart-card__badge">2021 – 2025</span>
          </div>
          <YearlyProfitChart />
        </div>

      </div>

      {/* ── Recent Trend text (if provided by backend) ───────────────────── */}
      {metrics?.['Recent Trend'] && (
        <div className="trend-banner">
          <span className="trend-banner__icon">📊</span>
          <span>{metrics['Recent Trend']}</span>
        </div>
      )}

      {/* ── Export buttons ────────────────────────────────────────────────── */}
      <div className="export-row">
        <button className="export-btn export-btn--csv" onClick={handleExportCSV}>
          <span>⬇</span> Export CSV
        </button>
        <button className="export-btn export-btn--png" onClick={handleDownloadPNG}>
          <span>🖼</span> Download PNG
        </button>
      </div>

    </div>
  );
};

export default Dashboard;
