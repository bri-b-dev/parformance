import { createRouter, createWebHistory } from 'vue-router'
import CalculatorView from '@/views/CalculatorView.vue'
import HistoryView from '@/views/HistoryView.vue'
import SettingsView from '@/views/SettingsView.vue'
import FAQ from '@/views/FAQ.vue'


const routes = [
  { path: '/', name: 'Calculator', component: CalculatorView },
  { path: '/history', name: 'History', component: HistoryView },
  { path: '/settings', name: 'Settings', component: SettingsView },
  { path: '/faq', name: 'FAQ', component: FAQ }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
