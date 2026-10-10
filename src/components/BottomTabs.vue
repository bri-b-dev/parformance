<template>
  <div class="bottom-tabs">
    <nav>
      <RouterLink class="tab" :class="{ active: isActive('/') || isActive('/drills') }" :to="preserve({ name: 'DrillsList' })" @click="triggerHaptic">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" stroke="currentColor"
              stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span>Drills</span>
      </RouterLink>
      <RouterLink class="tab" :class="{ active: isActive('/history') }" :to="preserve({ name: 'History' })" @click="triggerHaptic">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
            <path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </span>
        <span>Historie</span>
      </RouterLink>
      <RouterLink class="tab" :class="{ active: isActive('/handicap') }" :to="{ path: '/handicap' }" @click="triggerHaptic">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
            <rect x="5" y="3" width="14" height="18" rx="3" stroke="currentColor" stroke-width="1.6" />
            <path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </span>
        <span>Handicap</span>
      </RouterLink>
    </nav>
  </div>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router';
import { withPreservedQuery } from '@/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const route = useRoute();
const preserve = (to: any) => withPreservedQuery(to, route)

function isActive(prefix: string) {
  return route.path === prefix || route.path.startsWith(prefix + '/');
}

async function triggerHaptic() {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) {
    // Ignore if not supported
  }
}
</script>
<style scoped>
.icon {
  line-height: 0;
  display: inline-flex;
}
</style>
