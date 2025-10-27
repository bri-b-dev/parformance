<template>
  <button class="shuffle-btn" aria-label="Zufalls-Drill" @click="openShuffle">🎰</button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
function openShuffle() {
  router.push({ name: 'ShuffleOverlay' })
}
</script>

<style scoped>
.shuffle-btn {
  position: fixed;
  bottom: 92px;
  right: 20px;
  background: var(--primary);
  color: var(--primary-ink);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  border: 1px solid color-mix(in oklab, var(--primary) 40%, var(--border));
}
</style>
