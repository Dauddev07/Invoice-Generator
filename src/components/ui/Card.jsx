export function Card({ title, subtitle, action, children, className = '', padding = 'md' }) {
  return (
    <section className={`is-card is-card--pad-${padding} ${className}`.trim()}>
      {(title || subtitle || action) && (
        <header className="is-card__head">
          <div>
            {title ? <h2 className="is-card__title">{title}</h2> : null}
            {subtitle ? <p className="is-card__sub">{subtitle}</p> : null}
          </div>
          {action ? <div className="is-card__action">{action}</div> : null}
        </header>
      )}
      <div className="is-card__body">{children}</div>
    </section>
  )
}
