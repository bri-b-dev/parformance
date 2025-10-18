<template>
  <section>
    <h2>{{ isNew ? 'Neues Spiel' : 'Spiel bearbeiten' }}</h2>
    <DrillForm :model-value="existing" @save="onSave"/>
  </section>
</template>


<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import DrillForm from '@/components/DrillForm.vue';
import {useDrillStore} from '@/stores/drills';
import {useRoute, useRouter} from 'vue-router';


const store = useDrillStore();
const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isNew = computed(() => !id || id === 'new');
const existing = ref();


onMounted(async () => {
  await store.load();
  existing.value = isNew.value ? undefined : store.drills.find(d => d.id === id);
});


async function onSave(payload: any) {
  if (isNew.value) {
    await store.add(payload);
  } else if (existing.value) {
    await store.update({...existing.value, ...payload});
  }
  router.push('/drills');
}
</script>