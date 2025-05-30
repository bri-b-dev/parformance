<template>
  <div class="card">
    <FaqItem
      v-for="(item, i) in items"
      :key="i"
      :title="item.title"
      :text="item.text"
    />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import FaqItem from './FaqItem.vue'

const { t } = useI18n()

// Hier baust du dein FAQ-Array auf.
// Titel und Text kommen aus den i18n-Messages,
// daher wird t('key') jeweils aufgerufen.
const items = [
  {
    title: t('sdVsHcpiTitle'),     // z.B. "Score Differential vs. HCPI"
    text:  t('sdVsHcpiText')       // dein langer HTML-String mit <br/> & <b>
  },
  // weitere Items folgen hier:
  // {
  //   title: t('anotherFaqTitle'),
  //   text:  t('anotherFaqText')
  // },
]
</script>
