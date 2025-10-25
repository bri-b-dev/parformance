import { createRouter, createWebHistory, createMemoryHistory, type Router, type RouterHistory, type RouteLocationRaw, type RouteLocationNormalizedLoaded } from 'vue-router'

// Views/Components used by the routes (lazy to avoid SFC parsing in unit tests)
const DrillList = () => import('@/components/DrillList.vue')
const RandomizerView = () => import('@/views/RandomizerView.vue')

// Lightweight placeholder views to keep routing minimal for now
// Detail view: shows a drill based on :id (actual rendering can be implemented later)
const DrillDetailView = () => import('@/views/DrillDetailView.vue')
// Stats view placeholder
const StatsView = () => import('@/views/StatsView.vue')

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
    component: DrillDetailView,
    props: true,
  },
  {
    name: 'Stats',
    path: '/stats',
    component: StatsView,
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
const defaultHistory = (typeof window !== 'undefined' && typeof window.document !== 'undefined')
  ? createWebHistory()
  : createMemoryHistory()
const router = makeRouter(defaultHistory)
export default router
