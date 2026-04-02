export function Table({ children, className = '' }) {
  return (
    <div className={`is-table-wrap ${className}`.trim()}>
      <table className="is-table">{children}</table>
    </div>
  )
}

export function Th({ children, className = '', ...props }) {
  return (
    <th className={`is-table__th ${className}`.trim()} {...props}>
      {children}
    </th>
  )
}

export function Td({ children, className = '', ...props }) {
  return (
    <td className={`is-table__td ${className}`.trim()} {...props}>
      {children}
    </td>
  )
}
