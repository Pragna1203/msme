import React from 'react';
import './StatsCard.css';

const StatsCard = ({ title, value, trend, trendValue, color, icon }) => {
  const isPositive = trend === 'up';

  return (
    <div className={`stats-card stats-card--${color}`}>
      <div className="stats-card__icon">{icon}</div>
      <div className="stats-card__body">
        <span className="stats-card__label">{title}</span>
        <div className="stats-card__value">{value}</div>
        <div className={`stats-card__trend ${isPositive ? 'trend--up' : 'trend--down'}`}>
          <span className="trend-arrow">{isPositive ? '↑' : '↓'}</span>
          <span className="trend-value">{trendValue}</span>
          <span className="trend-label"> vs last period</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
