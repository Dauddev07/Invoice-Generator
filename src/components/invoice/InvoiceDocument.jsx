import { PreviewField, PreviewNumber } from './PreviewField'
import { formatCurrency } from '../../utils/formatCurrency'
import { STATUSES } from '../../utils/constants'

function StatusPill({ status }) {
  const label = STATUSES.find((s) => s.value === status)?.label ?? status
  return <span className={`is-inv-status is-inv-status--${status}`}>{label}</span>
}

function ItemsBlock({
  invoice,
  previewEditable,
  onItemChange,
  lineClass,
}) {
  const { items, currency } = invoice
  return (
    <table className={lineClass}>
      <thead>
        <tr>
          <th>Description</th>
          <th className="is-inv-col-qty">Qty</th>
          <th className="is-inv-col-rate">Rate</th>
          <th className="is-inv-col-amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={4} className="is-inv-empty">
              No line items yet. Add items in the editor.
            </td>
          </tr>
        ) : (
          items.map((row) => {
            const line = (Number(row.quantity) || 0) * (Number(row.rate) || 0)
            return (
              <tr key={row.id}>
                <td>
                  {previewEditable ? (
                    <PreviewField
                      value={row.description}
                      onChange={(v) => onItemChange(row.id, { description: v })}
                      placeholder="Description"
                      ariaLabel="Line description"
                    />
                  ) : (
                    row.description || '—'
                  )}
                </td>
                <td className="is-inv-col-qty">
                  {previewEditable ? (
                    <PreviewNumber
                      value={row.quantity}
                      onChange={(v) => onItemChange(row.id, { quantity: v })}
                      ariaLabel="Quantity"
                    />
                  ) : (
                    row.quantity
                  )}
                </td>
                <td className="is-inv-col-rate">
                  {previewEditable ? (
                    <PreviewNumber
                      value={row.rate}
                      onChange={(v) => onItemChange(row.id, { rate: v })}
                      ariaLabel="Rate"
                    />
                  ) : (
                    formatCurrency(row.rate, currency)
                  )}
                </td>
                <td className="is-inv-col-amt">{formatCurrency(line, currency)}</td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )
}

function TotalsBlock({ invoice, totals, variant }) {
  const { currency, taxRate, discountType, discountValue } = invoice
  const discLabel =
    discountType === 'percent' ? `Discount (${discountValue}%)` : 'Discount'
  return (
    <div className={`is-inv-totals is-inv-totals--${variant}`}>
      <div className="is-inv-totals__row">
        <span>Subtotal</span>
        <span>{formatCurrency(totals.subtotal, currency)}</span>
      </div>
      <div className="is-inv-totals__row">
        <span>{discLabel}</span>
        <span>−{formatCurrency(totals.discountAmount, currency)}</span>
      </div>
      <div className="is-inv-totals__row">
        <span>Tax ({taxRate}%)</span>
        <span>{formatCurrency(totals.taxAmount, currency)}</span>
      </div>
      <div className="is-inv-totals__row is-inv-totals__total">
        <span>Total</span>
        <span>{formatCurrency(totals.total, currency)}</span>
      </div>
    </div>
  )
}

export function InvoiceDocument({
  invoice,
  totals,
  previewEditable,
  onFieldChange,
  onItemChange,
}) {
  const t = invoice.template || 'modern'
  const rootClass = `is-inv-doc is-inv-doc--${t}`

  const logo = invoice.logoDataUrl ? (
    <img src={invoice.logoDataUrl} alt="" className="is-inv-logo" />
  ) : (
    <div className="is-inv-logo-placeholder" aria-hidden>
      Logo
    </div>
  )

  return (
    <div className={rootClass}>
      <header className="is-inv-head">
        <div className="is-inv-brand">{logo}</div>
        <div className="is-inv-meta">
          <h1 className="is-inv-title">Invoice</h1>
          <div className="is-inv-meta-grid">
            <div>
              <span className="is-inv-k">Invoice #</span>
              {previewEditable ? (
                <PreviewField
                  value={invoice.invoiceNumber}
                  onChange={(v) => onFieldChange('invoiceNumber', v)}
                  ariaLabel="Invoice number"
                />
              ) : (
                <p className="is-inv-v">{invoice.invoiceNumber}</p>
              )}
            </div>
            <div>
              <span className="is-inv-k">Issued</span>
              {previewEditable ? (
                <input
                  type="date"
                  value={invoice.issueDate}
                  onChange={(e) => onFieldChange('issueDate', e.target.value)}
                  className="is-preview-field"
                  aria-label="Issue date"
                />
              ) : (
                <p className="is-inv-v">{invoice.issueDate}</p>
              )}
            </div>
            <div>
              <span className="is-inv-k">Due</span>
              {previewEditable ? (
                <input
                  type="date"
                  value={invoice.dueDate}
                  onChange={(e) => onFieldChange('dueDate', e.target.value)}
                  className="is-preview-field"
                  aria-label="Due date"
                />
              ) : (
                <p className="is-inv-v">{invoice.dueDate}</p>
              )}
            </div>
            <div>
              <span className="is-inv-k">Status</span>
              <StatusPill status={invoice.status} />
            </div>
          </div>
        </div>
      </header>

      <section className="is-inv-parties">
        <div>
          <h3 className="is-inv-h3">From</h3>
          {previewEditable ? (
            <>
              <PreviewField
                value={invoice.companyName}
                onChange={(v) => onFieldChange('companyName', v)}
                ariaLabel="Company name"
              />
              <PreviewField
                value={invoice.companyEmail}
                onChange={(v) => onFieldChange('companyEmail', v)}
                ariaLabel="Company email"
              />
              <PreviewField
                multiline
                value={invoice.companyAddress}
                onChange={(v) => onFieldChange('companyAddress', v)}
                ariaLabel="Company address"
              />
              <PreviewField
                value={invoice.companyPhone}
                onChange={(v) => onFieldChange('companyPhone', v)}
                ariaLabel="Company phone"
              />
            </>
          ) : (
            <>
              <p className="is-inv-strong">{invoice.companyName}</p>
              <p>{invoice.companyEmail}</p>
              <p className="is-inv-muted">{invoice.companyAddress}</p>
              <p className="is-inv-muted">{invoice.companyPhone}</p>
            </>
          )}
        </div>
        <div>
          <h3 className="is-inv-h3">Bill to</h3>
          {previewEditable ? (
            <>
              <PreviewField
                value={invoice.clientName}
                onChange={(v) => onFieldChange('clientName', v)}
                ariaLabel="Client name"
              />
              <PreviewField
                value={invoice.clientEmail}
                onChange={(v) => onFieldChange('clientEmail', v)}
                ariaLabel="Client email"
              />
              <PreviewField
                multiline
                value={invoice.clientAddress}
                onChange={(v) => onFieldChange('clientAddress', v)}
                ariaLabel="Client address"
              />
            </>
          ) : (
            <>
              <p className="is-inv-strong">{invoice.clientName}</p>
              <p>{invoice.clientEmail}</p>
              <p className="is-inv-muted">{invoice.clientAddress}</p>
            </>
          )}
        </div>
      </section>

      <ItemsBlock
        invoice={invoice}
        previewEditable={previewEditable}
        onItemChange={onItemChange}
        lineClass="is-inv-lines"
      />

      <div className="is-inv-bottom">
        <div className="is-inv-notes">
          <h3 className="is-inv-h3">Notes</h3>
          {previewEditable ? (
            <PreviewField
              multiline={4}
              value={invoice.notes}
              onChange={(v) => onFieldChange('notes', v)}
              ariaLabel="Notes"
            />
          ) : (
            <p className="is-inv-muted">{invoice.notes}</p>
          )}
        </div>
        <TotalsBlock invoice={invoice} totals={totals} variant={t} />
      </div>
    </div>
  )
}
