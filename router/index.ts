import { createRouter, createWebHistory } from 'vue-router'
import CalculatorView from '@/views/CalculatorView.vue'
import HistoryView    from '@/views/HistoryView.vue'
import SettingsView   from '@/views/SettingsView.vue'

const routes = [
  { path: '/',        name: 'Calculator', component: CalculatorView },
  { path: '/history', name: 'History',    component: HistoryView },
  { path: '/settings',name: 'Settings',   component: SettingsView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
