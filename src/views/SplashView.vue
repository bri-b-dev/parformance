<template>
  <div class="splash">
    <img src="/splash-animated.svg" alt="ParFormance" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
onMounted(() => {
  // nach ~1.4s zur App springen (nach Animationsende)
  setTimeout(() => router.replace('/'), 1400)
})
</script>

<style scoped>
.splash {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  background: var(--bg);
}
.splash img {
  width: min(90vw, 640px);
  height: auto;
}
</style>
