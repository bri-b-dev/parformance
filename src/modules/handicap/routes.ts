import type { RouteRecordRaw } from 'vue-router'

// Child routes of /handicap (rendered inside HandicapShell). Components are lazy so that
// pdfjs-dist and Chart.js only load when the handicap area is opened.
export const handicapRoutes: RouteRecordRaw[] = [
  { path: '', name: 'HandicapCalculator', component: () => import('./views/CalculatorView.vue') },
  { path: 'history', name: 'HandicapHistory', component: () => import('./views/HistoryView.vue') },
  { path: 'settings', name: 'HandicapSettings', component: () => import('./views/SettingsView.vue') },
  { path: 'faq', name: 'HandicapFaq', component: () => import('./views/FAQ.vue') },
]
