import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { clampHcp, formatHcp, parseHcp } from '@/hcp/format'
import HcpInput from '@/components/HcpInput.vue'

describe('formatHcp', () => {
  it('uses a decimal comma and a plus sign for handicaps better than scratch', () => {
    expect(formatHcp(24.5)).toBe('24,5')
    expect(formatHcp(0)).toBe('0,0')
    expect(formatHcp(54)).toBe('54,0')
    expect(formatHcp(-2.5)).toBe('+2,5')
    expect(formatHcp(null)).toBe('')
    expect(formatHcp(NaN)).toBe('')
  })
})

describe('parseHcp', () => {
  it.each([
    ['24,5', 24.5], ['24.5', 24.5], [' 7 ', 7], ['0', 0], ['+2,5', -2.5], ['-2,5', -2.5], ['54', 54], ['+10', -10], ['24,', 24],
  ])('%s -> %s', (input, expected) => expect(parseHcp(input)).toEqual({ ok: true, value: expected }))

  it('treats empty input as "no value"', () => {
    expect(parseHcp('')).toEqual({ ok: true, value: null })
    expect(parseHcp('   ')).toEqual({ ok: true, value: null })
  })

  it.each(['abc', '55', '+11', '--2', '1,2,3', '24,555', '+'])('rejects %s', (input) => {
    expect(parseHcp(input)).toEqual({ ok: false })
  })

  it('round-trips through format and parse', () => {
    for (const v of [-10, -2.5, 0, 0.1, 18.4, 54]) expect(parseHcp(formatHcp(v))).toEqual({ ok: true, value: v })
  })

  it('clamps to the allowed range', () => {
    expect(clampHcp(60)).toBe(54)
    expect(clampHcp(-20)).toBe(-10)
    expect(clampHcp(12.34)).toBe(12.3)
  })
})

describe('HcpInput', () => {
  it('steps by 0.1, starts from the start value and clamps at the bounds', async () => {
    const w = mount(HcpInput, { props: { modelValue: null, startValue: 30 } })
    await w.find('[data-testid="hcp-plus"]').trigger('click')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([30])
    await w.setProps({ modelValue: 30 })
    await w.find('[data-testid="hcp-minus"]').trigger('click')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([29.9])
    await w.setProps({ modelValue: 54 })
    await w.find('[data-testid="hcp-plus"]').trigger('click')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([54])
    await w.setProps({ modelValue: -10 })
    await w.find('[data-testid="hcp-minus"]').trigger('click')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([-10])
  })

  it('follows the slider and shows the formatted value', async () => {
    const w = mount(HcpInput, { props: { modelValue: null } })
    const slider = w.find('[data-testid="hcp-slider"]')
    ;(slider.element as HTMLInputElement).value = '-2.5'
    await slider.trigger('input')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([-2.5])
    expect((w.find('[data-testid="hcp-field"]').element as HTMLInputElement).value).toBe('+2,5')
  })

  it('clears the value on invalid text and shows the error on blur only', async () => {
    const w = mount(HcpInput, { props: { modelValue: 20 } })
    const input = w.find('[data-testid="hcp-field"]')
    await input.setValue('99')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([null])
    expect(w.find('[role="alert"]').exists()).toBe(false)
    await input.trigger('blur')
    expect(w.find('[role="alert"]').exists()).toBe(true)
    await input.setValue('21,5')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([21.5])
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })
})
