import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../../src/stores/settings'

// Mock Capacitor Preferences
vi.mock('@capacitor/preferences', () => {
  return {
    Preferences: {
      get: vi.fn(async ({ key }: { key: string }) => ({ value: mockStorage[key] ?? null })),
      set: vi.fn(async ({ key, value }: { key: string, value: string }) => { mockStorage[key] = value }),
    }
  }
})

// In-memory mock storage
const mockStorage: Record<string, string> = {}

// Minimal jsdom-like globals for CustomEvent dispatch verification
declare global {
  // eslint-disable-next-line no-var
  var window: any
}

describe('useSettingsStore', () => {
  beforeEach(() => {
    // reset pinia and mock storage
    setActivePinia(createPinia())
    for (const k of Object.keys(mockStorage)) delete mockStorage[k]
  })

  it('can set and read hcp; persists and emits change event when window exists', async () => {
    const store = useSettingsStore()

    // Create a fake window to capture events
    const listeners: any[] = []
    // @ts-expect-error assign global
    global.window = {
      dispatchEvent: (evt: Event) => { listeners.push(evt) },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    expect(store.hcp).toBeNull()

    await store.setHcp(10)

    expect(store.hcp).toBe(10)

    // Verify persist was called via Preferences.set by checking mock storage contains settings
    const storedValue = Object.values(mockStorage)[0]
    expect(storedValue).toBeTruthy()
    const parsed = JSON.parse(storedValue as string)
    expect(parsed.hcp).toBe(10)

    // Verify event dispatched
    expect(listeners.length).toBe(1)
    expect((listeners[0] as CustomEvent).type).toBe('hcp-changed')
    expect((listeners[0] as CustomEvent).detail).toBe(10)
  })

  it('load() reads persisted settings', async () => {
    // seed storage
    const key = 'parformance.settings.v1'
    mockStorage[key] = JSON.stringify({ hcp: 22, handedness: 'left' })

    const store = useSettingsStore()
    await store.load()

    expect(store.loaded).toBe(true)
    expect(store.hcp).toBe(22)
    expect(store.handedness).toBe('left')
  })

  it('setHandedness() persists value', async () => {
    const store = useSettingsStore()
    await store.setHandedness('left')

    const storedValue = Object.values(mockStorage)[0]
    expect(storedValue).toBeTruthy()
    const parsed = JSON.parse(storedValue as string)
    expect(parsed.handedness).toBe('left')
  })
})
