const EXCHANGE_RATES = {
  USD: 1,
  INR: 83.2,
  EUR: 0.92,
};

const SYMBOLS = {
  USD: '$',
  INR: '₹',
  EUR: '€',
};

const LOCALES = {
  USD: 'en-US',
  INR: 'en-IN',
  EUR: 'de-DE',
};

/**
 * Converts a value from INR (base) to the target currency.
 * @param {number} value - Value in INR
 * @param {string} toCurrency - Target currency code
 * @returns {number} Converted value
 */
export const convertFromINR = (value, toCurrency) => {
  if (toCurrency === 'INR') return value;
  // Base is INR, convert to USD first then to target
  const inUSD = value / EXCHANGE_RATES.INR;
  return inUSD * (EXCHANGE_RATES[toCurrency] || 1);
};

/**
 * Formats a value as currency.
 * @param {number} value - Numeric value
 * @param {string} currency - Currency code
 * @returns {string} Formatted string
 */
export const formatCurrency = (value, currency) => {
  return new Intl.NumberFormat(LOCALES[currency] || 'en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export const getCurrencySymbol = (currency) => SYMBOLS[currency] || '₹';
