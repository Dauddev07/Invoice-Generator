const VARIANTS = {
  draft: 'is-badge--draft',
  pending: 'is-badge--pending',
  paid: 'is-badge--paid',
}

export function Badge({ children, status = 'draft', className = '' }) {
  const v = VARIANTS[status] || VARIANTS.draft
  return (
    <span className={`is-badge ${v} ${className}`.trim()} data-status={status}>
      {children}
    </span>
  )
}
