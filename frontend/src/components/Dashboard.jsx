import React, { useEffect, useState } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard = ({ metrics }) => {
    // We will simulate some chart data since the backend gives us raw totals.
    // In a production app, the backend would supply array data for these charts.
    const doughnutData = {
        labels: ['Electronics', 'Accessories', 'Office'],
        datasets: [
            {
                data: [55, 30, 15],
                backgroundColor: ['#a855f7', '#3b82f6', '#84cc16'],
                borderWidth: 0,
            },
        ],
    };

    return (
        <div className="dashboard-overview glass-panel animate-fade-in">
            <h2 className="section-title">Business Overview</h2>
            
            <div className="metrics-card">
                <div className="metric-header">
                    <h3>Financials</h3>
                    <span className="badge">Auto-updated</span>
                </div>
                
                <div className="metric-grid">
                    <div className="metric-box">
                        <span className="metric-label">Total Sales</span>
                        <div className="metric-value">
                            ${metrics?.['Total Sales'] ? metrics['Total Sales'].toLocaleString() : '0'}
                        </div>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{width: '75%', background: '#84cc16'}}></div>
                        </div>
                    </div>
                    
                    <div className="metric-box">
                        <span className="metric-label">Total Profit</span>
                        <div className="metric-value">
                            ${metrics?.['Total Profit'] ? metrics['Total Profit'].toLocaleString() : '0'}
                        </div>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{width: '60%', background: '#3b82f6'}}></div>
                        </div>
                    </div>
                    
                    <div className="metric-box">
                        <span className="metric-label">Total Orders</span>
                        <div className="metric-value">
                            {metrics?.['Total Orders'] || '0'}
                        </div>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{width: '90%', background: '#a855f7'}}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="metrics-card trend-card">
                 <div className="metric-header">
                    <h3>Recent Trend</h3>
                </div>
                <div className="trend-text">
                    {metrics?.['Recent Trend'] || 'Calculating...'}
                </div>
            </div>

            <div className="metrics-card chart-card">
                <div className="metric-header">
                    <h3>Category Distribution</h3>
                </div>
                <div className="chart-container">
                    <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
