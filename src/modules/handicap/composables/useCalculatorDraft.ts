import { reactive, toRefs, watch } from 'vue'

export interface CalculatorDraft {
  /** selected course template (values are copied into the fields, still editable) */
  templateId: number | null
  holes: string
  handicapIndexInput: number | null
  /** true while the HCPI field holds the user's own stored index (prefilled, not typed in) */
  handicapIsOwn: boolean
  courseRating: number | null
  slope: number | null
  grossScore: number | null
  pccAdjustment: number
}

const KEY = 'calculatorDraft'

export function emptyDraft(): CalculatorDraft {
  return {
    templateId: null,
    holes: '',
    handicapIndexInput: null,
    handicapIsOwn: true,
    courseRating: null,
    slope: null,
    grossScore: null,
    pccAdjustment: 0,
  }
}

function read(storage: Pick<Storage, 'getItem'> | undefined): CalculatorDraft {
  try {
    const raw = storage?.getItem(KEY)
    if (raw) return { ...emptyDraft(), ...JSON.parse(raw) }
  } catch {
    // unavailable or corrupt -> start empty
  }
  return emptyDraft()
}

/**
 * Calculator input that survives navigation (module state) and page reloads
 * (sessionStorage). Cleared with `reset()`.
 */
export function createCalculatorDraft(storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
  const draft = reactive<CalculatorDraft>(read(storage))

  watch(
    draft,
    (value) => {
      try {
        storage?.setItem(KEY, JSON.stringify(value))
      } catch {
        // storage full or blocked -> keep in memory only
      }
    },
    { deep: true, flush: 'sync' }
  )

  function reset() {
    Object.assign(draft, emptyDraft())
    try {
      storage?.removeItem(KEY)
    } catch {
      // ignore
    }
  }

  return { ...toRefs(draft), reset }
}

let instance: ReturnType<typeof createCalculatorDraft> | undefined

export function useCalculatorDraft() {
  instance ??= createCalculatorDraft(typeof sessionStorage === 'undefined' ? undefined : sessionStorage)
  return instance
}
