import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="is-modal-root" role="presentation">
      <button
        type="button"
        className="is-modal-backdrop"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={`is-modal is-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'is-modal-title' : undefined}
      >
        <div className="is-modal__top">
          {title ? (
            <h2 id="is-modal-title" className="is-modal__title">
              {title}
            </h2>
          ) : null}
          <Button variant="ghost" size="sm" className="is-modal__close" onClick={onClose} aria-label="Close">
            ×
          </Button>
        </div>
        <div className="is-modal__content">{children}</div>
        {footer ? <footer className="is-modal__footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}
