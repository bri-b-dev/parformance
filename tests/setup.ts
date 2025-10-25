// Global test setup for Vitest (jsdom)
// Provide minimal browser APIs that some libraries assume exist.

// @ts-ignore
if (typeof window !== 'undefined') {
  // vue-router tries to call window.scrollTo when using web history
  if (typeof window.scrollTo !== 'function') {
    // @ts-ignore
    window.scrollTo = () => {}
  }
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
