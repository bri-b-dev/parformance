import { onMounted, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'

type Pref = 'system' | 'light' | 'dark'

export function useTheme() {
    const settings = useSettingsStore()
    const preference = ref<Pref>('system')
    const theme = ref<'light' | 'dark'>('light')

    const apply = (value: 'light' | 'dark') => {
        try {
            document.documentElement.setAttribute('data-theme', value)
        } catch {
            /* ignore */
        }
    }

    const resolveTheme = (pref: Pref) => {
        if (pref === 'system') {
            try {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            } catch {
                return 'light'
            }
        }
        return pref
    }

    const applyPreference = (pref: Pref) => {
        preference.value = pref
        const resolved = resolveTheme(pref)
        theme.value = resolved
        apply(resolved)
    }

    onMounted(async () => {
        // Prefer the settings store as source of truth. Load it if needed.
        try {
            if (!settings.loaded && typeof settings.load === 'function') await settings.load()
        } catch {
            // ignore
        }

        if (settings && (settings.theme === 'system' || settings.theme === 'light' || settings.theme === 'dark')) {
            applyPreference(settings.theme)
        } else {
            // fallback to localStorage for older state
            try {
                const saved = localStorage.getItem('gt.theme') as Pref | null
                applyPreference(saved ?? 'system')
            } catch {
                applyPreference('system')
            }
        }

        // react to store changes
        watch(() => settings.theme, (v) => {
            if (v === 'system' || v === 'light' || v === 'dark') applyPreference(v)
        })

        // also react to system preference when user chooses 'system'
        try {
            const mq = window.matchMedia('(prefers-color-scheme: dark)')
            const onChange = () => {
                if (preference.value === 'system') applyPreference('system')
            }
            if (mq && typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange)
            else if (mq && typeof mq.addListener === 'function') mq.addListener(onChange)
        } catch {
            /* ignore */
        }
    })

    const toggle = () => {
        const next = theme.value === 'light' ? 'dark' : 'light'
        // Persist the user's explicit preference via the store so it becomes source of truth
        try {
            settings.update({ theme: next as 'light' | 'dark' })
        } catch {
            applyPreference(next as Pref)
        }
    }

    return { theme, preference, toggle, setPreference: applyPreference }
}