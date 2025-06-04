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

<style scoped>
/* Container behält max-width und ist zentriert */
.container {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
  padding-bottom: 70px; 
  min-height: 100vh;
  box-sizing: border-box;
}

/* Bottom Navigation jetzt exakt innerhalb container */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;                 /* Volle Viewport-Breite */
  background: #ffffff;
  border-top: 1px solid #dddddd;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

/* Innerer Container für Nav-Items, zentriert und max-width wie .container */
.nav-inner {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  display: flex;
}

/* Nav-Links */
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
  color: inherit;
}
.nav-item.active {
  color: var(--primary);
}
.nav-item.active .material-icons {
  color: var(--primary);
}
</style>