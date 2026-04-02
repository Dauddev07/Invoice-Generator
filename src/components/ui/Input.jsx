import { forwardRef } from 'react'

export const Input = forwardRef(function Input(
  { label, hint, error, className = '', compact, id, rows, ...props },
  ref,
) {
  const inputId = id || (label ? `field-${String(label).replace(/\s+/g, '-').toLowerCase()}` : undefined)
  const Control = rows != null ? 'textarea' : 'input'
  return (
    <div
      className={`is-field ${compact ? 'is-field--compact' : ''} ${error ? 'is-field--error' : ''} ${className}`.trim()}
    >
      {label ? (
        <label className="is-field__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <Control
        ref={ref}
        id={inputId}
        className="is-field__input"
        {...(rows != null ? { rows } : {})}
        {...props}
      />
      {error ? <p className="is-field__error">{error}</p> : null}
      {hint && !error ? <p className="is-field__hint">{hint}</p> : null}
    </div>
  )
})
