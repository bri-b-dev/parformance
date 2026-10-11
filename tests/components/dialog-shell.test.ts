import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DialogShell from '@/components/DialogShell.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import SettingsSheet from '@/components/SettingsSheet.vue'
import OnboardingModal from '@/components/OnboardingModal.vue'
import { requestConfirm } from '@/utils/confirmService'
import { useSettingsStore } from '@/stores/settings'

const mounted: Array<{ unmount: () => void }> = []

afterEach(() => {
  // unmount for real: the scroll lock and focus return are tied to the component lifecycle
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

const track = <T extends { unmount: () => void }>(w: T): T => { mounted.push(w); return w }

function shell(props: Record<string, unknown> = {}, slot = '<button id="a">A</button><button id="b">B</button><button id="c">C</button>') {
  return track(mount(DialogShell, {
    attachTo: document.body,
    props: { labelledby: 'ttl', ...props },
    slots: { default: `<h2 id="ttl">Titel</h2>${slot}` },
    attrs: { 'data-testid': 'panel', class: 'extra' },
  }))
}

const key = (w: ReturnType<typeof mount>, k: string, opts: KeyboardEventInit = {}) =>
  w.find('[role="dialog"]').element.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts }))

describe('DialogShell', () => {
  it('is a modal dialog named by its heading; attributes land on the panel', () => {
    const w = shell({ describedby: 'desc', backdropTestid: 'bd' })
    const d = w.find('[role="dialog"]')
    expect(d.attributes('aria-modal')).toBe('true')
    expect(d.attributes('aria-labelledby')).toBe('ttl')
    expect(d.attributes('aria-describedby')).toBe('desc')
    expect(d.attributes('data-testid')).toBe('panel')
    expect(d.classes()).toContain('extra')
    expect(w.find('[data-testid="bd"]').exists()).toBe(true)
  })

  it('has a variant and a layer class', () => {
    const w = shell({ variant: 'bottom', layer: 'alert' })
    expect(w.classes()).toEqual(expect.arrayContaining(['dlg-bottom', 'layer-alert']))
    expect(w.find('[role="dialog"]').classes()).toContain('card')
    expect(shell({ variant: 'full' }).find('[role="dialog"]').classes()).not.toContain('card')
  })

  it('closes on Escape once and does not let it bubble to a parent dialog', async () => {
    let parentSaw = 0
    const Parent = defineComponent({ setup: () => () => h('div', { onKeydown: () => { parentSaw++ } }, [h(DialogShell, { labelledby: 'ttl', onClose: () => closed.push(1) }, () => [h('button', 'x')])]) })
    const closed: number[] = []
    const w = track(mount(Parent, { attachTo: document.body }))
    await flushPromises()
    key(w as never, 'Escape')
    expect(closed).toHaveLength(1)
    expect(parentSaw).toBe(0)
  })

  it('closes on a backdrop click but not on a click inside, unless disabled', async () => {
    const w = shell()
    await w.find('[role="dialog"]').trigger('click')
    expect(w.emitted('close')).toBeUndefined()
    await w.trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
    const locked = shell({ backdropClose: false })
    await locked.trigger('click')
    expect(locked.emitted('close')).toBeUndefined()
  })

  it('focuses the requested element, else the first control, else the panel', async () => {
    const a = shell({ initialFocus: '#b' })
    await flushPromises()
    expect(document.activeElement?.id).toBe('b')
    a.unmount()
    const b = shell()
    await flushPromises()
    expect(document.activeElement?.id).toBe('a')
    b.unmount()
    const c = track(mount(DialogShell, { attachTo: document.body, props: { labelledby: 't' }, slots: { default: '<p id="t">nur Text</p>' } }))
    await flushPromises()
    expect(document.activeElement).toBe(c.find('[role="dialog"]').element)
  })

  it('keeps Tab inside: last -> first, Shift+Tab first -> last, and pulls stray focus back in', async () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    const w = shell()
    await flushPromises()
    const el = (id: string) => document.getElementById(id)!
    el('c').focus()
    expect(key(w, 'Tab')).toBe(false) // default prevented
    expect(document.activeElement).toBe(el('a'))
    key(w, 'Tab', { shiftKey: true })
    expect(document.activeElement).toBe(el('c'))
    outside.focus()
    key(w, 'Tab')
    expect(document.activeElement).toBe(el('a'))
    // inside the range Tab is left to the browser
    el('a').focus()
    expect(key(w, 'Tab')).toBe(true)
  })

  it('gives the focus back to what opened it', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const w = shell()
    await flushPromises()
    expect(document.activeElement).not.toBe(opener)
    w.unmount()
    await flushPromises()
    expect(document.activeElement).toBe(opener)
  })

  it('locks page scrolling while open, counted for stacked dialogs', async () => {
    document.body.style.overflow = 'auto'
    const a = shell()
    const b = shell()
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    a.unmount()
    expect(document.body.style.overflow).toBe('hidden')
    b.unmount()
    expect(document.body.style.overflow).toBe('auto')
  })
})

describe('dialogs built on the shell', () => {
  it('confirm: focuses "Abbrechen", resolves false on Escape/backdrop and true on OK', async () => {
    setActivePinia(createPinia())
    const w = track(mount(ConfirmModal, { attachTo: document.body }))
    const ask = async () => { const p = requestConfirm('Wirklich löschen?'); await flushPromises(); return p }

    let p = ask()
    await flushPromises()
    expect(document.activeElement).toBe(w.find('[data-testid="confirm-cancel"]').element)
    expect(w.find('[role="dialog"]').attributes('aria-describedby')).toBe('confirm-message')
    expect(w.text()).toContain('Wirklich löschen?')
    key(w, 'Escape')
    expect(await p).toBe(false)

    p = ask()
    await flushPromises()
    await w.find('[data-testid="confirm-backdrop"]').trigger('click')
    expect(await p).toBe(false)

    p = ask()
    await flushPromises()
    await w.find('[data-testid="confirm-ok"]').trigger('click')
    expect(await p).toBe(true)
    await flushPromises()
    expect(w.find('[role="dialog"]').exists()).toBe(false)
  })

  it('settings sheet: dialog semantics, Escape and "Schließen" close it', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const w = track(mount(SettingsSheet, { attachTo: document.body, props: { open: true }, global: { plugins: [pinia] } }))
    await flushPromises()
    const d = w.find('[role="dialog"]')
    expect(d.attributes('aria-labelledby')).toBe('settings-title')
    expect(w.find('#settings-title').text()).toBe('Einstellungen')
    key(w, 'Escape')
    expect(w.emitted('close')).toHaveLength(1)
    await w.findAll('button').find(b => b.text() === 'Schließen')!.trigger('click')
    expect(w.emitted('close')).toHaveLength(2)
    await w.setProps({ open: false })
    expect(w.find('[role="dialog"]').exists()).toBe(false)
  })

  it('onboarding: ignores backdrop clicks and keeps Escape as the way out', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore()
    await settings.load()
    const w = track(mount(OnboardingModal, { attachTo: document.body, global: { plugins: [pinia] } }))
    await flushPromises()
    await w.trigger('click') // backdrop
    expect(settings.onboardingDone).toBe(false)
    key(w, 'Escape')
    await flushPromises()
    expect(settings.onboardingDone).toBe(true)
  })
})
