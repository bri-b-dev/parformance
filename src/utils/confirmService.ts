type ConfirmHandler = (message: string) => Promise<boolean>

let handler: ConfirmHandler | null = null
const pending: Array<{ message: string; resolve: (v: boolean) => void }> = []

export function setConfirmHandler(h: ConfirmHandler | null) {
  handler = h
  // if a handler is set, flush any pending requests
  if (handler && pending.length > 0) {
    // drain sequentially
    (async () => {
      while (pending.length > 0) {
        const req = pending.shift()
        if (!req) break
        try {
          const res = await handler(req.message)
          req.resolve(res)
        } catch (e) {
          console.error('Error in confirm handler:', e)
          req.resolve(false)
        }
      }
    })()
  }
}

/** Request a confirmation. Returns a promise that resolves to true when confirmed. */
export function requestConfirm(message: string): Promise<boolean> {
  if (handler) {
    return handler(message).catch(() => {
      // fallthrough to queued/promise fallback
      return new Promise<boolean>((resolve) => {
        pending.push({ message, resolve })
        // Also set a safety timeout to fallback to global confirm after a short delay (1s)
        setTimeout(() => {
          // If still pending and no handler, use global confirm fallback
          const idx = pending.findIndex(p => p.resolve === resolve)
          if (idx !== -1 && !handler) {
            pending.splice(idx, 1)
            try {
              // @ts-ignore
              const fallback = typeof globalThis !== 'undefined' && typeof (globalThis as any).confirm === 'function' ? (globalThis as any).confirm(message) : false
              resolve(Boolean(fallback))
            } catch {
              resolve(false)
            }
          }
        }, 1000)
      })
    })
  }
  // If no handler yet, enqueue and return a promise to be resolved when handler appears
  return new Promise<boolean>((resolve) => {
    pending.push({ message, resolve })
    // Also set a safety timeout to fallback to global confirm after a short delay (1s)
    setTimeout(() => {
      // If still pending and no handler, use global confirm fallback
      const idx = pending.findIndex(p => p.resolve === resolve)
      if (idx !== -1 && !handler) {
        pending.splice(idx, 1)
        try {
          // @ts-ignore
          const fallback = typeof globalThis !== 'undefined' && typeof (globalThis as any).confirm === 'function' ? (globalThis as any).confirm(message) : false
          resolve(Boolean(fallback))
        } catch {
          resolve(false)
        }
      }
    }, 1000)
  })
}

export default { setConfirmHandler, requestConfirm }
