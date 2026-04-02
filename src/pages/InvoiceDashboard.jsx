import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInvoiceStore } from '../store/useInvoiceStore'
import { computeInvoiceTotals } from '../utils/calculations'
import { CURRENCIES, STATUSES, TEMPLATES, A4_WIDTH_PX } from '../utils/constants'
import { downloadInvoicePdf, downloadInvoicePng } from '../utils/exportInvoice'
import { buildFakeShareUrl } from '../utils/shareLink'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { CardSkeleton, Skeleton } from '../components/ui/Skeleton'
import { InvoiceDocument } from '../components/invoice/InvoiceDocument'
import { LineItemsEditor } from '../components/invoice/LineItemsEditor'
import { LogoDropzone } from '../components/invoice/LogoDropzone'

function usePersistReady() {
  const [ready, setReady] = useState(() => useInvoiceStore.persist?.hasHydrated?.() ?? false)
  useEffect(() => {
    const unsub = useInvoiceStore.persist.onFinishHydration(() => setReady(true))
    return unsub
  }, [])
  return ready
}

function useResolvedTheme(themePref) {
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = () => setSystemDark(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  if (themePref === 'dark') return 'dark'
  if (themePref === 'light') return 'light'
  return systemDark ? 'dark' : 'light'
}

function Toast({ message, variant, onDismiss }) {
  if (!message) return null
  return (
    <div className={`is-toast is-toast--${variant}`} role="status">
      <span>{message}</span>
      <button type="button" className="is-toast__x" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}

export default function InvoiceDashboard() {
  const ready = usePersistReady()
  const [mobileTab, setMobileTab] = useState('edit')
  const [previewEditable, setPreviewEditable] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)
  const [logoErr, setLogoErr] = useState(null)
  const exportRef = useRef(null)
  const toastTimerRef = useRef(0)

  const themePref = useInvoiceStore((s) => s.theme)
  const setTheme = useInvoiceStore((s) => s.setTheme)
  const resolvedTheme = useResolvedTheme(themePref)

  const invoiceIds = useInvoiceStore((s) => s.invoiceIds)
  const invoices = useInvoiceStore((s) => s.invoices)
  const activeInvoiceId = useInvoiceStore((s) => s.activeInvoiceId)
  const invoice = activeInvoiceId ? invoices[activeInvoiceId] : null

  const updateActiveInvoice = useInvoiceStore((s) => s.updateActiveInvoice)
  const addLineItem = useInvoiceStore((s) => s.addLineItem)
  const updateLineItem = useInvoiceStore((s) => s.updateLineItem)
  const removeLineItem = useInvoiceStore((s) => s.removeLineItem)
  const reorderLineItems = useInvoiceStore((s) => s.reorderLineItems)
  const setLogoDataUrl = useInvoiceStore((s) => s.setLogoDataUrl)
  const clearLogo = useInvoiceStore((s) => s.clearLogo)
  const newInvoice = useInvoiceStore((s) => s.newInvoice)
  const duplicateInvoice = useInvoiceStore((s) => s.duplicateInvoice)
  const selectInvoice = useInvoiceStore((s) => s.selectInvoice)
  const deleteInvoice = useInvoiceStore((s) => s.deleteInvoice)
  const touchSave = useInvoiceStore((s) => s.touchSave)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
  }, [resolvedTheme])

  const totals = useMemo(() => {
    if (!invoice) {
      return { subtotal: 0, discountAmount: 0, afterDiscount: 0, taxAmount: 0, total: 0 }
    }
    return computeInvoiceTotals(
      invoice.items,
      invoice.taxRate,
      invoice.discountType,
      invoice.discountValue,
    )
  }, [invoice])

  const showToast = useCallback((message, variant = 'info') => {
    setToast({ message, variant })
    window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4200)
  }, [])

  const handleExportPdf = async () => {
    const el = exportRef.current
    if (!el) {
      showToast('Export is not ready. Wait a moment and try again.', 'error')
      return
    }
    setExporting(true)
    try {
      await downloadInvoicePdf(el, `${invoice?.invoiceNumber || 'invoice'}.pdf`)
      showToast('PDF downloaded successfully.', 'success')
    } catch (err) {
      const hint = err instanceof Error && err.message ? ` (${err.message})` : ''
      showToast(`Could not generate PDF.${hint} Try PNG or disable browser privacy blockers.`, 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleExportPng = async () => {
    const el = exportRef.current
    if (!el) {
      showToast('Export is not ready. Wait a moment and try again.', 'error')
      return
    }
    setExporting(true)
    try {
      await downloadInvoicePng(el, `${invoice?.invoiceNumber || 'invoice'}.png`)
      showToast('PNG downloaded successfully.', 'success')
    } catch (err) {
      const hint = err instanceof Error && err.message ? ` (${err.message})` : ''
      showToast(`Could not export image.${hint}`, 'error')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        touchSave()
        showToast('Invoice saved locally.', 'success')
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        addLineItem()
        showToast('Line item added.', 'info')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [touchSave, addLineItem, showToast])

  if (!ready || !invoice) {
    return (
      <div className="is-app is-app--loading">
        <div className="is-shell">
          <header className="is-topbar">
            <Skeleton className="is-skeleton--logo" />
            <Skeleton className="is-skeleton--short" style={{ width: 120 }} />
          </header>
          <div className="is-layout">
            <aside className="is-panel">
              <CardSkeleton />
              <CardSkeleton />
            </aside>
            <main className="is-preview-shell">
              <Skeleton style={{ height: 520, borderRadius: 12 }} />
            </main>
          </div>
        </div>
      </div>
    )
  }

  const shareUrl = buildFakeShareUrl(invoice.id)

  return (
    <div className="is-app">
      <div className="is-shell">
        <header className="is-topbar">
          <div className="is-topbar__brand">
            <span className="is-mark" aria-hidden />
            <div>
              <span className="is-topbar__name">Invoice Studio</span>
              <span className="is-topbar__tag">Professional billing</span>
            </div>
          </div>

          <div className="is-topbar__center">
            <label className="is-sr-only" htmlFor="inv-picker">
              Active invoice
            </label>
            <select
              id="inv-picker"
              className="is-top-select"
              value={activeInvoiceId}
              onChange={(e) => selectInvoice(e.target.value)}
            >
              {invoiceIds.map((id) => (
                <option key={id} value={id}>
                  {invoices[id]?.invoiceNumber} · {invoices[id]?.clientName?.slice(0, 28) || 'Untitled'}
                </option>
              ))}
            </select>
            <Button type="button" variant="ghost" size="sm" onClick={() => setListOpen(true)}>
              All invoices
            </Button>
          </div>

          <div className="is-topbar__actions">
            <div className="is-theme-toggle" role="group" aria-label="Theme">
              {['light', 'system', 'dark'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`is-theme-btn ${themePref === t ? 'is-theme-btn--on' : ''}`}
                  onClick={() => setTheme(t)}
                >
                  {t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'Auto'}
                </button>
              ))}
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => duplicateInvoice()}>
              Duplicate
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => newInvoice()}>
              New invoice
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={() => setShareOpen(true)}>
              Share link
            </Button>
          </div>
        </header>

        <div className="is-workbench-meta">
          <p className="is-kbd-hint">
            <kbd>⌘</kbd>
            <kbd>S</kbd>
            <span className="is-kbd-hint__sep">save</span>
            <span className="is-kbd-hint__dot" aria-hidden />
            <kbd>⌘</kbd>
            <kbd>⇧</kbd>
            <kbd>A</kbd>
            <span className="is-kbd-hint__sep">add line</span>
          </p>
        </div>

        <div className="is-mobile-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'edit'}
            className={mobileTab === 'edit' ? 'is-on' : ''}
            onClick={() => setMobileTab('edit')}
          >
            Editor
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'preview'}
            className={mobileTab === 'preview' ? 'is-on' : ''}
            onClick={() => setMobileTab('preview')}
          >
            Preview
          </button>
        </div>

        <div className="is-layout is-workbench">
          <aside className={`is-panel ${mobileTab === 'edit' ? 'is-panel--show-mobile' : ''}`}>
            <Card
              title="Invoice details"
              subtitle="Status, currency, and identifiers"
              action={<Badge status={invoice.status}>{STATUSES.find((s) => s.value === invoice.status)?.label}</Badge>}
            >
              <div className="is-grid-2">
                <Select
                  label="Status"
                  value={invoice.status}
                  onChange={(e) => updateActiveInvoice({ status: e.target.value })}
                  options={STATUSES}
                />
                <Select
                  label="Currency"
                  value={invoice.currency}
                  onChange={(e) => updateActiveInvoice({ currency: e.target.value })}
                  options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
                />
              </div>
              <div className="is-grid-2">
                <Input
                  label="Invoice number"
                  value={invoice.invoiceNumber}
                  onChange={(e) => updateActiveInvoice({ invoiceNumber: e.target.value })}
                />
                <Select
                  label="Template"
                  value={invoice.template}
                  onChange={(e) => updateActiveInvoice({ template: e.target.value })}
                  options={TEMPLATES}
                />
              </div>
              <div className="is-template-pills" role="group" aria-label="Quick template">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.value}
                    type="button"
                    className={`is-pill ${invoice.template === tpl.value ? 'is-pill--on' : ''}`}
                    onClick={() => updateActiveInvoice({ template: tpl.value })}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Your company" subtitle="Shown on every invoice">
              <LogoDropzone
                logoDataUrl={invoice.logoDataUrl}
                onSetLogo={setLogoDataUrl}
                onClear={clearLogo}
                error={logoErr}
                setError={setLogoErr}
              />
              <Input
                label="Company name"
                value={invoice.companyName}
                onChange={(e) => updateActiveInvoice({ companyName: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={invoice.companyEmail}
                onChange={(e) => updateActiveInvoice({ companyEmail: e.target.value })}
              />
              <Input
                label="Phone"
                value={invoice.companyPhone}
                onChange={(e) => updateActiveInvoice({ companyPhone: e.target.value })}
              />
              <Input
                label="Address"
                value={invoice.companyAddress}
                onChange={(e) => updateActiveInvoice({ companyAddress: e.target.value })}
              />
            </Card>

            <Card title="Client" subtitle="Bill to">
              <Input
                label="Client name"
                value={invoice.clientName}
                onChange={(e) => updateActiveInvoice({ clientName: e.target.value })}
              />
              <Input
                label="Client email"
                type="email"
                value={invoice.clientEmail}
                onChange={(e) => updateActiveInvoice({ clientEmail: e.target.value })}
              />
              <Input
                label="Client address"
                value={invoice.clientAddress}
                onChange={(e) => updateActiveInvoice({ clientAddress: e.target.value })}
              />
            </Card>

            <Card title="Line items" subtitle="Drag rows to reorder">
              <LineItemsEditor
                items={invoice.items}
                onAdd={addLineItem}
                onUpdate={updateLineItem}
                onRemove={removeLineItem}
                onReorder={reorderLineItems}
              />
            </Card>

            <Card title="Totals" subtitle="Tax and discounts">
              <div className="is-grid-2">
                <Input
                  label="Tax rate %"
                  type="number"
                  min={0}
                  step="any"
                  value={invoice.taxRate}
                  onChange={(e) => updateActiveInvoice({ taxRate: parseFloat(e.target.value) || 0 })}
                />
                <Select
                  label="Discount type"
                  value={invoice.discountType}
                  onChange={(e) => updateActiveInvoice({ discountType: e.target.value })}
                  options={[
                    { value: 'percent', label: 'Percent' },
                    { value: 'fixed', label: 'Fixed amount' },
                  ]}
                />
              </div>
              <Input
                label={invoice.discountType === 'percent' ? 'Discount %' : `Discount (${invoice.currency})`}
                type="number"
                min={0}
                step="any"
                value={invoice.discountValue}
                onChange={(e) => updateActiveInvoice({ discountValue: parseFloat(e.target.value) || 0 })}
              />
              <div className="is-totals-readout">
                <div>
                  <span className="is-muted">Subtotal</span>
                  <strong>{CURRENCIES.find((c) => c.value === invoice.currency)?.symbol} {totals.subtotal.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="is-muted">Total</span>
                  <strong className="is-total-pill">{CURRENCIES.find((c) => c.value === invoice.currency)?.symbol} {totals.total.toFixed(2)}</strong>
                </div>
              </div>
            </Card>

            <Card title="Notes" subtitle="Optional message on the invoice">
              <Input
                label="Notes"
                rows={3}
                value={invoice.notes}
                onChange={(e) => updateActiveInvoice({ notes: e.target.value })}
              />
            </Card>
          </aside>

          <main className={`is-preview-shell ${mobileTab === 'preview' ? 'is-preview-shell--show-mobile' : ''}`}>
            <div className="is-preview-toolbar">
              <div className="is-preview-toolbar__left">
                <span className="is-preview-label">Live preview</span>
                <label className="is-toggle">
                  <input
                    type="checkbox"
                    checked={previewEditable}
                    onChange={(e) => setPreviewEditable(e.target.checked)}
                  />
                  <span>Edit in preview</span>
                </label>
              </div>
              <div className="is-preview-toolbar__right">
                <Button type="button" variant="secondary" size="sm" disabled={exporting} onClick={handleExportPdf}>
                  {exporting ? 'Working…' : 'Download PDF'}
                </Button>
                <Button type="button" variant="secondary" size="sm" disabled={exporting} onClick={handleExportPng}>
                  Export PNG
                </Button>
              </div>
            </div>

            <div className="is-preview-scroll">
              <div
                className="is-preview-stage"
                style={{ width: A4_WIDTH_PX, maxWidth: '100%' }}
              >
                <div className="is-export-surface" data-template={invoice.template}>
                  <InvoiceDocument
                    invoice={invoice}
                    totals={totals}
                    previewEditable={previewEditable}
                    onFieldChange={(key, value) => updateActiveInvoice({ [key]: value })}
                    onItemChange={(itemId, partial) => updateLineItem(itemId, partial)}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share invoice"
        size="md"
        footer={
          <Button
            type="button"
            variant="primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareUrl)
                showToast('Link copied to clipboard.', 'success')
              } catch {
                showToast('Clipboard unavailable. Copy the link manually.', 'error')
              }
            }}
          >
            Copy link
          </Button>
        }
      >
        <p className="is-modal-copy">
          This is a demo share URL for presentation purposes. No data is uploaded.
        </p>
        <div className="is-fake-url">
          <code>{shareUrl}</code>
        </div>
      </Modal>

      <Modal open={listOpen} onClose={() => setListOpen(false)} title="Your invoices" size="lg">
        <ul className="is-inv-list">
          {invoiceIds.map((id) => {
            const inv = invoices[id]
            return (
              <li key={id} className={id === activeInvoiceId ? 'is-inv-list__on' : ''}>
                <button type="button" className="is-inv-list__btn" onClick={() => { selectInvoice(id); setListOpen(false) }}>
                  <span className="is-inv-list__num">{inv.invoiceNumber}</span>
                  <span className="is-inv-list__client">{inv.clientName}</span>
                  <Badge status={inv.status}>{inv.status}</Badge>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={invoiceIds.length <= 1}
                  onClick={() => {
                    if (window.confirm('Delete this invoice?')) deleteInvoice(id)
                  }}
                >
                  Delete
                </Button>
              </li>
            )
          })}
        </ul>
      </Modal>

      <Toast
        message={toast?.message}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />

      {/* Off-screen raster target: always laid out so html2canvas works (e.g. mobile Editor tab). */}
      <div className="is-export-portal" aria-hidden="true">
        <div
          id="invoice-export-root"
          ref={exportRef}
          className="is-export-surface is-export-surface--for-print"
          data-template={invoice.template}
        >
          <InvoiceDocument
            invoice={invoice}
            totals={totals}
            previewEditable={false}
            onFieldChange={(key, value) => updateActiveInvoice({ [key]: value })}
            onItemChange={(itemId, partial) => updateLineItem(itemId, partial)}
          />
        </div>
      </div>
    </div>
  )
}
