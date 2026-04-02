export function Skeleton({ className = '', style }) {
  return <span className={`is-skeleton ${className}`.trim()} style={style} aria-hidden />
}

export function CardSkeleton() {
  return (
    <div className="is-card is-card--pad-md">
      <Skeleton className="is-skeleton--title" />
      <Skeleton className="is-skeleton--line" />
      <Skeleton className="is-skeleton--line is-skeleton--short" />
    </div>
  )
}
