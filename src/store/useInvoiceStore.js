import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '../utils/constants'

function newId() {
  return crypto.randomUUID()
}

export function createDefaultLineItem() {
  return {
    id: newId(),
    description: '',
    quantity: 1,
    rate: 0,
  }
}

export function createEmptyInvoice(invoiceNumber) {
  const today = new Date().toISOString().slice(0, 10)
  const due = new Date()
  due.setDate(due.getDate() + 14)
  return {
    id: newId(),
    invoiceNumber: invoiceNumber || 'INV-0001',
    issueDate: today,
    dueDate: due.toISOString().slice(0, 10),
    status: 'draft',
    currency: 'USD',
    template: 'modern',
    companyName: 'Acme Studio Inc.',
    companyEmail: 'billing@acmestudio.com',
    companyAddress: '1200 Market Street, San Francisco, CA',
    companyPhone: '+1 (415) 555-0199',
    clientName: 'Client Company Ltd.',
    clientEmail: 'accounts@client.com',
    clientAddress: '88 King Street, London',
    taxRate: 10,
    discountType: 'percent',
    discountValue: 0,
    notes: 'Thank you for your business.',
    logoDataUrl: null,
    items: [createDefaultLineItem()],
    updatedAt: Date.now(),
  }
}

const defaultState = () => {
  const inv = createEmptyInvoice('INV-0001')
  return {
    theme: 'system',
    invoiceCounter: 1,
    invoiceIds: [inv.id],
    invoices: { [inv.id]: inv },
    activeInvoiceId: inv.id,
  }
}

export const useInvoiceStore = create(
  persist(
    (set, get) => ({
      ...defaultState(),

      setTheme: (theme) => set({ theme }),

      getActiveInvoice: () => {
        const { activeInvoiceId, invoices } = get()
        if (!activeInvoiceId) return null
        return invoices[activeInvoiceId] ?? null
      },

      updateActiveInvoice: (partial) => {
        const id = get().activeInvoiceId
        if (!id) return
        set((s) => ({
          invoices: {
            ...s.invoices,
            [id]: {
              ...s.invoices[id],
              ...partial,
              updatedAt: Date.now(),
            },
          },
        }))
      },

      addLineItem: () => {
        const id = get().activeInvoiceId
        if (!id) return
        set((s) => {
          const inv = s.invoices[id]
          if (!inv) return s
          return {
            invoices: {
              ...s.invoices,
              [id]: {
                ...inv,
                items: [...inv.items, createDefaultLineItem()],
                updatedAt: Date.now(),
              },
            },
          }
        })
      },

      updateLineItem: (itemId, partial) => {
        const id = get().activeInvoiceId
        if (!id) return
        set((s) => {
          const inv = s.invoices[id]
          if (!inv) return s
          return {
            invoices: {
              ...s.invoices,
              [id]: {
                ...inv,
                items: inv.items.map((row) =>
                  row.id === itemId ? { ...row, ...partial } : row,
                ),
                updatedAt: Date.now(),
              },
            },
          }
        })
      },

      removeLineItem: (itemId) => {
        const id = get().activeInvoiceId
        if (!id) return
        set((s) => {
          const inv = s.invoices[id]
          if (!inv || inv.items.length <= 1) return s
          return {
            invoices: {
              ...s.invoices,
              [id]: {
                ...inv,
                items: inv.items.filter((row) => row.id !== itemId),
                updatedAt: Date.now(),
              },
            },
          }
        })
      },

      reorderLineItems: (activeId, overId) => {
        const invId = get().activeInvoiceId
        if (!invId) return
        set((s) => {
          const inv = s.invoices[invId]
          if (!inv) return s
          const oldIndex = inv.items.findIndex((i) => i.id === activeId)
          const newIndex = inv.items.findIndex((i) => i.id === overId)
          if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return s
          const next = [...inv.items]
          const [removed] = next.splice(oldIndex, 1)
          next.splice(newIndex, 0, removed)
          return {
            invoices: {
              ...s.invoices,
              [invId]: { ...inv, items: next, updatedAt: Date.now() },
            },
          }
        })
      },

      setLogoDataUrl: (dataUrl) => {
        get().updateActiveInvoice({ logoDataUrl: dataUrl })
      },

      clearLogo: () => {
        get().updateActiveInvoice({ logoDataUrl: null })
      },

      newInvoice: () => {
        const counter = get().invoiceCounter + 1
        const num = `INV-${String(counter).padStart(4, '0')}`
        const inv = createEmptyInvoice(num)
        set((s) => ({
          invoiceCounter: counter,
          invoiceIds: [inv.id, ...s.invoiceIds],
          invoices: { ...s.invoices, [inv.id]: inv },
          activeInvoiceId: inv.id,
        }))
        return inv.id
      },

      duplicateInvoice: () => {
        const current = get().getActiveInvoice()
        if (!current) return null
        const counter = get().invoiceCounter + 1
        const num = `INV-${String(counter).padStart(4, '0')}`
        const copy = {
          ...current,
          id: newId(),
          invoiceNumber: num,
          status: 'draft',
          updatedAt: Date.now(),
          items: current.items.map((row) => ({ ...row, id: newId() })),
        }
        set((s) => ({
          invoiceCounter: counter,
          invoiceIds: [copy.id, ...s.invoiceIds],
          invoices: { ...s.invoices, [copy.id]: copy },
          activeInvoiceId: copy.id,
        }))
        return copy.id
      },

      selectInvoice: (invoiceId) => {
        if (!get().invoices[invoiceId]) return
        set({ activeInvoiceId: invoiceId })
      },

      deleteInvoice: (invoiceId) => {
        set((s) => {
          const ids = s.invoiceIds.filter((i) => i !== invoiceId)
          const { [invoiceId]: _, ...rest } = s.invoices
          if (ids.length === 0) {
            const fresh = defaultState()
            return fresh
          }
          let nextActive = s.activeInvoiceId
          if (nextActive === invoiceId) {
            nextActive = ids[0]
          }
          return {
            invoiceIds: ids,
            invoices: rest,
            activeInvoiceId: nextActive,
          }
        })
      },

      /** Persist snapshot manually (already auto-persisted); for UX "Saved" toast */
      touchSave: () => {
        const id = get().activeInvoiceId
        if (!id) return
        set((s) => ({
          invoices: {
            ...s.invoices,
            [id]: { ...s.invoices[id], updatedAt: Date.now() },
          },
        }))
      },
    }),
    {
      name: STORAGE_KEYS.STORE,
      partialize: (s) => ({
        theme: s.theme,
        invoiceCounter: s.invoiceCounter,
        invoiceIds: s.invoiceIds,
        invoices: s.invoices,
        activeInvoiceId: s.activeInvoiceId,
      }),
      merge: (persisted, current) => {
        const p = { ...current, ...persisted }
        const valid =
          Array.isArray(p.invoiceIds) &&
          p.invoiceIds.length > 0 &&
          p.activeInvoiceId &&
          p.invoices?.[p.activeInvoiceId]
        if (!valid) {
          return { ...current, ...defaultState() }
        }
        return p
      },
    },
  ),
)
