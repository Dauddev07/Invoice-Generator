export function buildFakeShareUrl(invoiceId) {
  const token = typeof btoa === 'function' ? btoa(invoiceId).replace(/=+$/, '') : invoiceId.slice(0, 12)
  return `https://invoic.studio/v/${token}`
}
