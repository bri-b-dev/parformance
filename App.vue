<template>
  <div id="app" class="container">
    <!-- Hauptinhalt -->
    <router-view />

    <!-- Bottom Navigation (Android-Stil) -->
    <nav class="bottom-nav">
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

<style>
.container {
  max-width: 900px;
  margin: auto;
  padding-bottom: 70px;
  /* Platz für Bottom-Nav */
  background: var(--bg-page);
  min-height: 100vh;
  position: relative;
}

/* Bottom Navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  max-width: 900px;
  display: flex;
  background: #fff;
  border-top: 1px solid #ddd;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.nav-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nav-item .material-icons {
  font-size: 24px;
  margin-bottom: 2px;
}

.nav-item.active {
  color: var(--primary);
}

.nav-item.active .material-icons {
  color: var(--primary);
}
</style>
