// Global test setup for Vitest (jsdom)
// Provide minimal browser APIs that some libraries assume exist.

// @ts-ignore
if (typeof window !== 'undefined') {
  // vue-router tries to call window.scrollTo when using web history
  // Always override to a no-op to avoid jsdom "Not implemented" errors
  // @ts-ignore
  window.scrollTo = () => {}
  // Polyfill requestAnimationFrame for timers/animations
  if (typeof window.requestAnimationFrame !== 'function') {
    // @ts-ignore
    window.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16) as any
  }
  if (typeof window.cancelAnimationFrame !== 'function') {
    // @ts-ignore
    window.cancelAnimationFrame = (id: any) => clearTimeout(id)
  }
  // Ensure basic Event constructors exist for @vue/test-utils trigger()
  ;['MouseEvent','KeyboardEvent','Event','InputEvent'].forEach((name) => {
    // @ts-ignore
    if (typeof window[name] !== 'function') {
      // @ts-ignore
      window[name] = class extends window.Event {}
    }
  })
}

// Stub common router components for @vue/test-utils so tests don't need a router instance
import { config as VTUConfig } from '@vue/test-utils'
if (VTUConfig && VTUConfig.global) {
  VTUConfig.global.stubs = Object.assign({}, VTUConfig.global.stubs || {}, {
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
