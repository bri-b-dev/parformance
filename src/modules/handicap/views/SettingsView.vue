<template>
  <div class="card settings-card">
    <h1 class="title">{{ t('settingsTitle') }}</h1>

    <!-- switch locale -->
    <div class="form-group">
      <label for="languageSelect">{{ t('selectLanguage') }}</label>
      <select id="languageSelect" v-model="currentLocale" @change="onLocaleChange">
        <option value="de">Deutsch</option>
        <option value="en">English</option>
      </select>
    </div>

    <!-- course templates -->
    <div class="form-group">
      <CourseTemplates />
    </div>

    <!-- Rules‐PDF -->
    <div class="form-group">
      <label>{{ t('downloadRules') }}</label>
      <a href="https://www.usga.org/content/dam/usga/pdf/2024-revision/2024-Rules-of-Handicapping-USGA.pdf"
        target="_blank" rel="noopener" class="rules-link">
        {{ t('currentRules') }}
      </a>
    </div>

    <!-- App‐Info -->
    <div class="form-group">
      <label>{{ t('aboutApp') }}</label>
      <p>Version: {{ APP_VERSION }}</p>
      <p>{{ t('appAuthor') }}</p>
    </div>

    <!-- data privacy/copyright (just link) -->
    <div class="form-group">
      <label>{{ t('legal') }}</label>
      <a href="/impressum" class="rules-link">{{ t('impressum') }}</a><br />
      <a href="/datenschutz" class="rules-link">{{ t('dataProtection') }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { db } from '../db'
import CourseTemplates from '../components/CourseTemplates.vue'

// i18n
const { t, locale } = useI18n()
const currentLocale = ref(locale.value)

// app-version from env (e.g. in vue.config.js or .env)
const APP_VERSION = (import.meta as any).env.VITE_APP_VERSION || '1.0'

// on locale change: save to db
async function onLocaleChange() {
  locale.value = currentLocale.value
  await db.settings.put({ key: 'locale', value: currentLocale.value })
}

onMounted(() => {
  currentLocale.value = locale.value
})
</script>

<style scoped>
.rules-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.rules-link:hover {
  text-decoration: underline;
}

.settings-card select {
  padding: 8px;
  border: 1px solid #cccccc;
  border-radius: 4px;
}

.settings-card p {
  margin: 0.25rem 0;
  color: var(--text);
  font-size: 0.95rem;
}
</style>
