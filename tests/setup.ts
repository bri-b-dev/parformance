// Global test setup for Vitest (jsdom)
// Provide minimal browser APIs that some libraries assume exist.

// @ts-ignore
if (typeof globalThis !== 'undefined') {
  // vue-router tries to call globalThis.scrollTo when using web history
  // Always override to a no-op to avoid jsdom "Not implemented" errors
  // @ts-ignore
  globalThis.scrollTo = () => {}
  // Polyfill requestAnimationFrame for timers/animations
  if (typeof globalThis.requestAnimationFrame !== 'function') {
    // @ts-ignore
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16) as any
  }
  if (typeof globalThis.cancelAnimationFrame !== 'function') {
    // @ts-ignore
    globalThis.cancelAnimationFrame = (id: any) => clearTimeout(id)
  }
  // Ensure basic Event constructors exist for @vue/test-utils trigger()
  for (const name of ['MouseEvent','KeyboardEvent','Event','InputEvent']) {
    // @ts-ignore
    if (typeof globalThis[name] !== 'function') {
      // @ts-ignore
      globalThis[name] = class extends globalThis.Event {}
    }
  }
}

// Stub common router components for @vue/test-utils so tests don't need a router instance
import { config as VTUConfig } from '@vue/test-utils'
if (VTUConfig?.global) {
  VTUConfig.global.stubs = { ...VTUConfig.global.stubs, ...{
    // Render RouterLink as a plain anchor so tests can inspect href attributes
    RouterLink: {
      props: ['to'],
      // Render RouterLink as an anchor and forward any attributes (style, class, etc.)
      // Use single quotes inside the expression and an empty string fallback to avoid
      // template parsing issues in tests.
      template: `<a v-bind="$attrs" :href="typeof to === 'string' ? to : (to.path || to.href || '')"><slot /></a>`,
    },
    // Render RouterView as a simple div
    RouterView: { template: '<div />' },
  })
}
