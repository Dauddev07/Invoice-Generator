import { A4_HEIGHT_PX, A4_WIDTH_PX } from './constants'

const SYSTEM_FONT =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

/** Printable margins (mm) — top smaller so content sits under typical viewer chrome */
const PDF_MARGIN_X = 12
const PDF_MARGIN_TOP = 10
const PDF_MARGIN_BOTTOM = 14

function triggerDownload(href, filename) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  a.style.position = 'fixed'
  a.style.left = '-9999px'
  document.body.appendChild(a)
  a.click()
  requestAnimationFrame(() => a.remove())
}

/**
 * Trim fully white/near-white rows from top and bottom of raster (tighter PDF/PNG).
 * @param {HTMLCanvasElement} canvas
 */
function trimCanvasVerticalWhitespace(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const w = canvas.width
  const h = canvas.height
  if (w < 1 || h < 1) return canvas

  let data
  try {
    data = ctx.getImageData(0, 0, w, h).data
  } catch {
    return canvas
  }

  const nearWhite = (i) => {
    const a = data[i + 3]
    if (a < 8) return true
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    return r >= 252 && g >= 252 && b >= 252
  }

  const rowIsBlank = (y) => {
    const row = y * w * 4
    for (let x = 0; x < w; x++) {
      if (!nearWhite(row + x * 4)) return false
    }
    return true
  }

  let top = 0
  let bottom = h - 1
  const maxTopScan = Math.floor(h * 0.4)
  while (top < maxTopScan && rowIsBlank(top)) top++
  while (bottom > top && rowIsBlank(bottom)) bottom--

  if (bottom <= top) return canvas

  const nh = bottom - top + 1
  const out = document.createElement('canvas')
  out.width = w
  out.height = nh
  const octx = out.getContext('2d')
  if (!octx) return canvas
  octx.drawImage(canvas, 0, top, w, nh, 0, 0, w, nh)
  return out
}

/**
 * Avoid tainted canvas from cross-origin webfonts when rasterizing.
 * @param {Document} clonedDoc
 * @param {string} exportRootId
 */
function neutralizeFontsInClone(clonedDoc, exportRootId) {
  const root = clonedDoc.getElementById(exportRootId)
  if (!root) return
  const apply = (el) => {
    try {
      el.style.fontFamily = SYSTEM_FONT
    } catch {
      /* ignore */
    }
  }
  apply(root)
  root.querySelectorAll('*').forEach(apply)
}

/**
 * @param {HTMLElement} element
 * @param {{ scale?: number, backgroundColor?: string }} options
 */
async function captureElement(element, options = {}) {
  const { default: html2canvas } = await import('html2canvas')
  const { scale = 2, backgroundColor = '#ffffff' } = options

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* continue */
    }
  }

  const w = Math.max(1, Math.ceil(element.scrollWidth || element.offsetWidth || A4_WIDTH_PX))
  const h = Math.max(1, Math.ceil(element.scrollHeight || element.offsetHeight))

  const opts = (allowTaint) => ({
    scale,
    useCORS: true,
    allowTaint,
    backgroundColor,
    logging: false,
    width: w,
    height: h,
    windowWidth: w,
    windowHeight: h,
    scrollX: 0,
    scrollY: 0,
    imageTimeout: 20000,
    onclone(clonedDoc) {
      neutralizeFontsInClone(clonedDoc, 'invoice-export-root')
    },
  })

  try {
    return await html2canvas(element, opts(false))
  } catch {
    return html2canvas(element, opts(true))
  }
}

/**
 * Scale image to fit inside a box; **top-aligned** when shorter than max height (no huge top gap).
 */
function fitImageToPdfBox(canvasWidth, canvasHeight, maxW, maxH) {
  const ratio = canvasWidth / canvasHeight
  let imgW = maxW
  let imgH = imgW / ratio
  if (imgH > maxH) {
    imgH = maxH
    imgW = imgH * ratio
  }
  return { imgW, imgH }
}

async function downloadCanvas(canvas, filename, mime) {
  const isPng = mime === 'image/png'
  const ext = isPng ? '.png' : '.jpg'

  const name = filename.replace(/\.(png|jpg|jpeg)$/i, '') + ext

  try {
    const dataUrl = canvas.toDataURL(mime, isPng ? undefined : 0.92)
    triggerDownload(dataUrl, name)
    return
  } catch {
    /* fall through — tainted or size limits */
  }

  await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not create image blob'))
          return
        }
        const url = URL.createObjectURL(blob)
        triggerDownload(url, name)
        window.setTimeout(() => URL.revokeObjectURL(url), 2500)
        resolve()
      },
      mime,
      isPng ? undefined : 0.92,
    )
  })
}

/**
 * @param {HTMLElement} element
 * @param {string} filename
 */
export async function downloadInvoicePng(element, filename = 'invoice.png') {
  let canvas = await captureElement(element)
  canvas = trimCanvasVerticalWhitespace(canvas)
  await downloadCanvas(canvas, filename, 'image/png')
}

/**
 * @param {HTMLElement} element
 * @param {string} filename
 */
export async function downloadInvoicePdf(element, filename = 'invoice.pdf') {
  const [{ jsPDF }] = await Promise.all([import('jspdf')])
  let canvas = await captureElement(element)
  canvas = trimCanvasVerticalWhitespace(canvas)

  let imgData
  let fmt = 'PNG'
  try {
    imgData = canvas.toDataURL('image/png', 1)
  } catch {
    imgData = canvas.toDataURL('image/jpeg', 0.92)
    fmt = 'JPEG'
  }

  const pdfW = 210
  const pdfH = 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const maxW = pdfW - PDF_MARGIN_X * 2
  const maxH = pdfH - PDF_MARGIN_TOP - PDF_MARGIN_BOTTOM
  const { imgW, imgH } = fitImageToPdfBox(canvas.width, canvas.height, maxW, maxH)

  const x = PDF_MARGIN_X + (maxW - imgW) / 2
  const y = PDF_MARGIN_TOP

  pdf.addImage(imgData, fmt, x, y, imgW, imgH, undefined, fmt === 'PNG' ? 'FAST' : 'MEDIUM')
  pdf.save(filename.replace(/\.pdf$/i, '') + '.pdf')
}

export { A4_WIDTH_PX, A4_HEIGHT_PX }
