<template>
    <div class="card">
        <FaqItem v-for="(item, i) in items" :key="i" :title="item.title" :text="item.text" />
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FaqItem from './FaqItem.vue'

const { t } = useI18n()

const items = computed(() => [
    {
        title: t('sdVsHcpiTitle'),
        text: t('sdVsHcpiText')
    },

    // TODO: course rating
    // TODO: slope
    // TODO: gbe
    // TODO: pcc
    // TODO: cap-verfahren
])

</script>
