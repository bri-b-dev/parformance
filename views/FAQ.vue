<template>
  <div class="card faq-card">
    <h2>{{ $t('faqTitle') }}</h2>
    <FaqItem
      v-for="(item, i) in items"
      :key="i"
      :title="item.title"
      :text="item.text"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FaqItem from '@/components/FaqItem.vue'

const { t } = useI18n()

const items = computed(() => [
  {
    title: t('courseRatingTitle'),
    text: t('courseRatingText')
  },
  {
    title: t('slopeTitle'),
    text: t('slopeText')
  },
  {
    title: t('grossScoreTitle'),
    text: t('grossScoreText')
  },
  {
    title: t('pccTitle'),
    text: t('pccText')
  },
  {
    title: t('sdCalculationTitle'),
    text: t('sdCalculationText')
  },
  {
    title: t('sdVsHcpiTitle'),
    text: t('sdVsHcpiText')
  },
  {
    title: t('capTitle'),
    text: t('capText')
  },
  {
    title: t('breakTitle'),
    text: t('breakText')
  },
])
</script>

<style scoped>
.faq-card {
  margin-top: 1rem;
}
</style>