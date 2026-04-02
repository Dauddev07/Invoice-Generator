/**
 * @param {Array<{ quantity: number, rate: number }>} items
 * @param {number} taxRatePercent
 * @param {'percent' | 'fixed'} discountType
 * @param {number} discountValue
 */
export function computeInvoiceTotals(items, taxRatePercent, discountType, discountValue) {
  const safeItems = Array.isArray(items) ? items : []
  const subtotal = safeItems.reduce((sum, row) => {
    const q = Number(row.quantity) || 0
    const r = Number(row.rate) || 0
    return sum + q * r
  }, 0)

  const taxRate = Math.max(0, Number(taxRatePercent) || 0)
  const discVal = Math.max(0, Number(discountValue) || 0)

  let discountAmount = 0
  if (discountType === 'percent') {
    discountAmount = subtotal * Math.min(discVal, 100) / 100
  } else {
    discountAmount = Math.min(discVal, subtotal)
  }

  const afterDiscount = Math.max(0, subtotal - discountAmount)
  const taxAmount = afterDiscount * (taxRate / 100)
  const total = afterDiscount + taxAmount

  return {
    subtotal,
    discountAmount,
    afterDiscount,
    taxAmount,
    total,
  }
}
