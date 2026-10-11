export interface ConfirmOptions {
  /** Visible heading (otherwise the dialog is only named for screen readers). */
  title?: string
  confirmLabel?: string
  /** Destructive action: the confirm button is styled as danger and "Abbrechen" has the focus. */
  danger?: boolean
  /** The user must type this word (case-insensitive) before the action is enabled. */
  phrase?: string
  /** Extra lines under the message, e.g. what will be deleted. */
  details?: string[]
  /** An action offered inside the dialog (e.g. "export a backup first"); resolves true when it worked. */
  secondary?: { label: string; doneLabel?: string; run: () => Promise<boolean | void> }
}

type ConfirmHandler = (message: string, options?: ConfirmOptions) => Promise<boolean>

let handler: ConfirmHandler | null = null
const pending: Array<{ message: string; options?: ConfirmOptions; resolve: (v: boolean) => void }> = []

export function setConfirmHandler(h: ConfirmHandler | null) {
  handler = h
  // if a handler is set, flush any pending requests
  if (handler) {
    void (async () => {
      while (pending.length > 0) {
        const req = pending.shift()!
        try {
          req.resolve(await handler!(req.message, req.options))
        } catch (e) {
          console.error('Error in confirm handler:', e)
          req.resolve(false)
        }
      }
    })()
  }
}

/** Without a mounted dialog (very early, or in tests) fall back to the browser's confirm after a moment. */
function fallbackAfterDelay(message: string, resolve: (v: boolean) => void) {
  setTimeout(() => {
    const idx = pending.findIndex(p => p.resolve === resolve)
    if (idx === -1 || handler) return
    pending.splice(idx, 1)
    try {
      const c = (globalThis as { confirm?: (m: string) => boolean }).confirm
      resolve(typeof c === 'function' ? Boolean(c(message)) : false)
    } catch {
      resolve(false)
    }
  }, 1000)
}

/** Ask the user. Resolves to true only when they confirmed. */
export function requestConfirm(message: string, options?: ConfirmOptions): Promise<boolean> {
  if (handler) {
    return handler(message, options).catch(() => new Promise<boolean>((resolve) => {
      pending.push({ message, options, resolve })
      fallbackAfterDelay(message, resolve)
    }))
  }
  return new Promise<boolean>((resolve) => {
    pending.push({ message, options, resolve })
    fallbackAfterDelay(message, resolve)
  })
}
