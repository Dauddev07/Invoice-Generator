export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  const cls = ['is-btn', `is-btn--${variant}`, `is-btn--${size}`, className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={cls} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
