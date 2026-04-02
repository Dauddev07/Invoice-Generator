export function Select({ label, options, className = '', id, ...props }) {
  const selectId =
    id ||
    (label ? `sel-${String(label).replace(/\s+/g, '-').toLowerCase()}` : undefined)
  return (
    <div className={`is-field ${className}`.trim()}>
      {label ? (
        <label className="is-field__label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <select id={selectId} className="is-field__select" {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
