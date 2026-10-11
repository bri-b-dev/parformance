<template>
  <div class="bottom-tabs">
    <nav :aria-label="$t('app.nav.main')">
      <RouterLink class="tab" :class="{ active: isActive('/today') || isActive('/run') }" :aria-current="isActive('/today') || isActive('/run') ? 'page' : undefined"
        :to="{ name: 'Today' }" @click="triggerHaptic">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
            <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" stroke-width="1.6" />
            <path d="M4 10h16M9 3v4M15 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </span>
        <span>{{ $t('app.nav.today') }}</span>
      </RouterLink>

      <RouterLink class="tab" :class="{ active: isActive('/drills') || isActive('/drill') || isActive('/collections') }" :aria-current="isActive('/drills') || isActive('/drill') || isActive('/collections') ? 'page' : undefined"
        :to="preserve({ name: 'DrillsList' })" @click="triggerHaptic">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
            <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" stroke="currentColor"
              stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span>{{ $t('app.nav.drills') }}</span>
      </RouterLink>

      <!-- Primary action: random drill. Kept in the middle of the bar instead of floating over the content. -->
      <button type="button" class="tab-fab" :aria-label="$t('app.nav.shuffle')" @click="openShuffle">
        <svg width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
          <rect x="5.5" y="3" width="9" height="3" rx="1.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          <rect x="5.8" y="9" width="3.2" height="4" rx="0.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          <rect x="9.4" y="9" width="3.2" height="4" rx="0.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          <rect x="13" y="9" width="3.2" height="4" rx="0.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M17 10.5l2.6-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="20.6" cy="7.8" r="1.2" fill="currentColor" />
        </svg>
      </button>

      <RouterLink class="tab" :class="{ active: isActive('/handicap') }" :aria-current="isActive('/handicap') ? 'page' : undefined"
        :to="{ path: '/handicap' }" @click="triggerHaptic">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
            <rect x="5" y="3" width="14" height="18" rx="3" stroke="currentColor" stroke-width="1.6" />
            <path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </span>
        <span>{{ $t('app.nav.handicap') }}</span>
      </RouterLink>

      <RouterLink class="tab" :class="{ active: isActive('/progress') }" :aria-current="isActive('/progress') ? 'page' : undefined"
        :to="preserve({ name: 'Progress' })" @click="triggerHaptic">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
            <path d="M4 19V5M4 19h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            <path d="M8 15l3.5-4 3 2.5L19 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span>{{ $t('app.nav.progress') }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router';
import { withPreservedQuery } from '@/router';
import { useUiStore } from '@/stores/ui';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const route = useRoute();
const ui = useUiStore();
const preserve = (to: any) => withPreservedQuery(to, route)

function isActive(prefix: string) {
  return route.path === prefix || route.path.startsWith(prefix + '/');
}

async function triggerHaptic() {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Ignore if not supported
  }
}

async function openShuffle() {
  await triggerHaptic()
  ui.setShuffle(true)
}
</script>
<style scoped>
.icon {
  line-height: 0;
  display: inline-flex;
}

.tab-fab {
  width: 56px;
  height: 56px;
  margin-top: -22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: var(--primary-ink);
  border: 3px solid var(--bg);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}

.tab-fab:focus-visible {
  outline: 3px solid var(--ring, currentColor);
  outline-offset: 2px;
}
</style>
