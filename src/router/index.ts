import { createRouter, createWebHistory, createMemoryHistory, type Router, type RouterHistory, type RouteLocationRaw, type RouteLocationNormalizedLoaded } from 'vue-router'

// Views/Components used by the routes (lazy in browser; stubbed in tests/SSR to avoid SFC parsing)
const isBrowser = globalThis !== undefined && (globalThis.window as any)?.document !== undefined
const Stub = { render() { return null } }

const DrillList = isBrowser ? (() => import('@/components/DrillList.vue')) : Stub
const RandomizerView = isBrowser ? (() => import('@/views/RandomizerView.vue')) : Stub

// Detail view: shows a drill based on :id
const DrillDetailView = isBrowser ? (() => import('@/views/DrillDetailView.vue')) : Stub
// Stats view placeholder
const StatsView = isBrowser ? (() => import('@/views/StatsView.vue')) : Stub

const ConstructionView = isBrowser ? (() => import('@/views/ConstructionView.vue')) : Stub
const FavoritesView = isBrowser ? (() => import('@/views/FavoritesView.vue')) : Stub

export const routes = [
  { path: '/', redirect: { name: 'DrillsList' } },
  {
    name: 'DrillsList',
    path: '/drills',
    component: DrillList,
  },
  {
    name: 'DrillDetail',
    path: '/drill/:id',
    // Support alias '/drills/:id' to match user expectation and existing list URL patterns
    alias: '/drills/:id',
    component: DrillDetailView,
    props: true,
  },
  {
    name: 'History',
    path: '/history',
    component: StatsView,
  },
  {
    name: 'Construction',
    path: '/construction',
    component: ConstructionView,
  },
    {
    name: 'Favorites',
    path: '/favorites',
    component: FavoritesView,
  },
  {
    name: 'ShuffleOverlay',
    path: '/shuffle',
    component: RandomizerView,
  },
]

export function makeRouter(history?: RouterHistory): Router {
  const h = history ?? createWebHistory()
  return createRouter({
    history: h,
    routes,
    scrollBehavior() {
      // Only return a scroll position when the global scroll API exists.
      // In some test environments (jsdom) window.scrollTo may be missing or not implemented.
      if (globalThis.window !== undefined && typeof (globalThis.window as any).scrollTo === 'function') {
        return { top: 0 }
      }
      // avoid invoking scroll behavior that would call window.scrollTo in environments without it
      return undefined
    },
  })
}

// Helper to preserve current filters (query params) when navigating
export function withPreservedQuery(to: RouteLocationRaw, from: RouteLocationNormalizedLoaded): RouteLocationRaw {
  // Normalize to object form and merge query from current route
  if (typeof to === 'string') return { path: to, query: { ...from.query } }
  if ('query' in to) {
    return { ...to, query: { ...(to as any).query, ...from.query } }
  }
  // name/path based locations without query
  return { ...(to as any), query: { ...from.query } }
}

// Default router for the application. Use memory history when no window exists (tests/SSR)
const defaultHistory = globalThis?.document
  ? createWebHistory()
  : createMemoryHistory()
const router = makeRouter(defaultHistory)
export default router
