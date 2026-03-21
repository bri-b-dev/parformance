<template>
<div id="app">
    <!-- centered content -->
  <div class="container">
    <router-view />
  </div>

    <!-- bottom navigation (full width) -->
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
      <router-link to="/faq" class="nav-item" active-class="active">
        <span class="material-icons">quiz</span>
        <span>{{ $t('navFaq') }}</span>
      </router-link>
    </div>
  </nav>
</div>
</template>


<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { db } from './db'

// load locale from db if saved
const { locale } = useI18n()
onMounted(async () => {
  const saved = await db.settings.get('locale')
  if (saved?.value) {
    locale.value = saved.value
  }
})
</script>

<style scoped>
/* container keeps max-width and is centered */
.container {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem;
  padding-bottom: 90px; 
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: calc(90px + env(safe-area-inset-bottom, 12px)); 
}

/* bottom navigation exactly underneigh container */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.04);
  z-index: 100;

  /* place for android/ios-system-navigation */
  padding-bottom: env(safe-area-inset-bottom, 12px);
}

/* inner container for nav-items, centered and max-widtih like .container */
.nav-inner {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  display: flex;
}

/* nav-links */
.nav-item {
  flex: 1;
  text-align: center;
  padding: 10px 0 8px 0;
  color: #64748b;
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
}

.nav-item .material-icons {
  font-size: 26px;
  padding: 6px 18px;
  border-radius: 24px;
  margin-bottom: 4px;
  color: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item:hover {
  color: var(--primary);
}

.nav-item.active {
  color: var(--primary);
  font-weight: 600;
}

.nav-item.active .material-icons {
  background: rgba(4, 75, 47, 0.08);
  color: var(--primary);
  transform: scale(1.05);
}
</style>