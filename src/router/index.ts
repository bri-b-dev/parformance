import { handicapRoutes } from '@/modules/handicap/routes'
import { createRouter, createWebHistory, createMemoryHistory, type Router, type RouterHistory, type RouteLocationRaw, type RouteLocationNormalizedLoaded, type RouteRecordRaw } from 'vue-router'

// Views/Components used by the routes (lazy in browser; stubbed in tests/SSR to avoid SFC parsing)
const isBrowser = globalThis !== undefined && (globalThis.window as any)?.document !== undefined
const Stub = { render() { return null } }

const TodayView = isBrowser ? (() => import('@/views/TodayView.vue')) : Stub
const HistoryListView = isBrowser ? (() => import('@/views/HistoryListView.vue')) : Stub
const CollectionsView = isBrowser ? (() => import('@/views/CollectionsView.vue')) : Stub
const RunView = isBrowser ? (() => import('@/views/RunView.vue')) : Stub
const DrillList = isBrowser ? (() => import('@/components/DrillList.vue')) : Stub

// Detail view: shows a drill based on :id
const DrillDetailView = isBrowser ? (() => import('@/views/DrillDetailView.vue')) : Stub
// Stats view placeholder
const StatsView = isBrowser ? (() => import('@/views/StatsView.vue')) : Stub

// Handicap area (module): lazy shell with lazy child routes
const HandicapShell = isBrowser ? (() => import('@/modules/handicap/HandicapShell.vue')) : Stub

/** Slightly longer than the 250 ms page transition in App.vue. */
export const SCROLL_RESTORE_DELAY_MS = 320

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: { name: 'Today' } },
  { name: 'Today', path: '/today', component: TodayView },
  { name: 'Collections', path: '/collections', component: CollectionsView },
  { name: 'Run', path: '/run', component: RunView },
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
    name: 'Progress',
    path: '/progress',
    component: StatsView,
  },
  { name: 'ProgressHistory', path: '/progress/history', component: HistoryListView },
  // old bookmark/deep link
  { path: '/history', redirect: { name: 'Progress' } },
  {
    path: '/handicap',
    component: HandicapShell,
    children: handicapRoutes,
  },
]

export function makeRouter(history?: RouterHistory): Router {
  const h = history ?? createWebHistory()
  return createRouter({
    history: h,
    routes,
    // Back/forward restores the saved scroll position (list -> drill -> back); new pages start at the top.
    // The page transition (see App.vue) keeps the new view out of the DOM for a moment, so restoring waits for it.
    scrollBehavior(_to, _from, savedPosition) {
      // Only act when the global scroll API exists (jsdom/SSR may lack it)
      if (globalThis.window === undefined || typeof (globalThis.window as any).scrollTo !== 'function') return undefined
      if (savedPosition) return new Promise(resolve => setTimeout(() => resolve(savedPosition), SCROLL_RESTORE_DELAY_MS))
      return { top: 0 }
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
