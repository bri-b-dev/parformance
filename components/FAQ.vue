<template>

    <div class="card faq-card">
        <div class="faq-header" @click="toggleSD">
            <h2>Score Differential vs. HCPI</h2>
            <button class="toggle-button" aria-label="Toggle info">
                {{ showSD ? '-' : '+' }}
            </button>
        </div>
        <transition name="collapse">
            <div v-show="showSD" class="faq-content">
                <p v-html="$t('sdVsHcpiText')"></p>
            </div>
        </transition>
    </div>

</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const showSD = ref(false)
function toggleSD() {
    showSD.value = !showSD.value
}
</script>

<style scoped>
.faq-card {
    margin-top: 1rem;
}

.faq-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 0.5rem 1rem;
    background: var(--bg-card);
    border-bottom: 1px solid #ddd;
}

.toggle-button {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
}

.collapse-enter-from,
.collapse-leave-to {
    height: 0;
    overflow: hidden;
}

.collapse-enter-active,
.collapse-leave-active {
    transition: height 0.3s ease;
}

.faq-content {
    padding: 1rem;
}

.pre-line {
  white-space: pre-line;
}
</style>