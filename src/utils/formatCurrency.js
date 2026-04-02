import { CURRENCIES } from './constants'

const localeMap = {
  USD: 'en-US',
  PKR: 'en-PK',
  EUR: 'de-DE',
  GBP: 'en-GB',
}

export function getCurrencyMeta(code) {
  return CURRENCIES.find((c) => c.value === code) ?? CURRENCIES[0]
}

export function formatCurrency(amount, currencyCode) {
  const code = currencyCode || 'USD'
  const locale = localeMap[code] || 'en-US'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0)
  } catch {
    const { symbol } = getCurrencyMeta(code)
    return `${symbol} ${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`
  }
}
