<template>
<div id="app">
    <!-- ZENTRIERTER INHALT -->
  <div class="container">
    <router-view />
  </div>

    <!-- BOTTOM NAVIGATION (FULL WIDTH) -->
  <nav class="bottom-nav">
    <div class="nav-inner">
      <router-link to="/" class="nav-item" exact-active-class="active">
        <span class="material-icons">calculate</span>
        <span>{{ $t('navCalculator') }}</span>
      </router-link>
      <router-link to="/history" class="nav-item" active-class="active">
        <span class="material-icons">insights</span>
        <span>{{ $t('navHistory') }}</span>
      </router-link>
      <router-link to="/settings" class="nav-item" active-class="active">
        <span class="material-icons">settings</span>
        <span>{{ $t('navSettings') }}</span>
      </router-link>
    </div>
  </nav>
</div>
</template>


<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { db } from '@/db'

// Sprache aus IndexedDB laden, falls gespeichert
const { locale } = useI18n()
onMounted(async () => {
  const saved = await db.settings.get('locale')
  if (saved?.value) {
    locale.value = saved.value
  }
})
</script>
