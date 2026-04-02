import { useCallback, useRef, useState } from 'react'
import { Button } from '../ui/Button'

const MAX_BYTES = 2 * 1024 * 1024

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('Could not read file'))
    r.readAsDataURL(file)
  })
}

export function LogoDropzone({ logoDataUrl, onSetLogo, onClear, error, setError }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    async (files) => {
      const file = files?.[0]
      if (!file || !file.type.startsWith('image/')) {
        setError?.('Please drop a PNG, JPG, or SVG image.')
        return
      }
      if (file.size > MAX_BYTES) {
        setError?.('Image must be under 2 MB.')
        return
      }
      setError?.(null)
      try {
        const url = await readFileAsDataUrl(file)
        onSetLogo(url)
      } catch {
        setError?.('Failed to load image.')
      }
    },
    [onSetLogo, setError],
  )

  return (
    <div
      className={`is-dropzone ${dragOver ? 'is-dropzone--active' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
      role="presentation"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
        className="is-dropzone__input"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {logoDataUrl ? (
        <div className="is-dropzone__preview">
          <img src={logoDataUrl} alt="Company logo" />
          <div className="is-dropzone__actions">
            <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="is-dropzone__empty"
          onClick={() => inputRef.current?.click()}
        >
          <span className="is-dropzone__icon" aria-hidden>
            ↑
          </span>
          <span className="is-dropzone__label">Drop logo or click to upload</span>
          <span className="is-dropzone__hint">PNG, JPG, SVG · max 2 MB</span>
        </button>
      )}
      {error ? <p className="is-dropzone__err">{error}</p> : null}
    </div>
  )
}
