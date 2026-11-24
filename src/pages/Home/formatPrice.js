export function formatPrice(price, currency) {
  return Number.isFinite(price)
    ? price.toLocaleString('id-ID', { style: 'currency', currency: currency.name, maximumFractionDigits: price < 1 ? 10 : 2 })
    : '—'
}
