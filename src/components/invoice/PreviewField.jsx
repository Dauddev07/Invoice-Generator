export function PreviewField({
  value,
  onChange,
  multiline,
  className = '',
  placeholder,
  ariaLabel,
}) {
  const common = {
    value: value ?? '',
    onChange: (e) => onChange?.(e.target.value),
    placeholder,
    'aria-label': ariaLabel,
    className: `is-preview-field ${className}`.trim(),
  }
  if (multiline) {
    return <textarea rows={multiline === true ? 2 : multiline} {...common} />
  }
  return <input type="text" {...common} />
}

export function PreviewNumber({ value, onChange, min = 0, className = '', ariaLabel }) {
  return (
    <input
      type="number"
      min={min}
      step="any"
      value={Number.isFinite(Number(value)) ? value : 0}
      onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
      className={`is-preview-field is-preview-field--num ${className}`.trim()}
      aria-label={ariaLabel}
    />
  )
}
