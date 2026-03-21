import { createApp } from 'vue'
import App from './App.vue'
import { createI18n } from 'vue-i18n'
import router from './router'

import '@/assets/global.css'

import { en } from './locales/en'
import { de } from './locales/de'

// define i18n messages
const messages = {
  en,
  de
}

// create i18n instance with options
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'de',
  messages,
  warnHtmlMessage: false
})

const app = createApp(App)
app.use(i18n)
app.use(router)
app.mount('#app')
