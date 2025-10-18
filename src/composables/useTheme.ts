import {onMounted, ref} from 'vue';

const KEY = 'gt.theme';

export function useTheme() {
    const theme = ref<'light' | 'dark'>('light');
    const apply = () => document.documentElement.setAttribute('data-theme', theme.value);
    onMounted(() => {
        const saved = localStorage.getItem(KEY) as 'light' | 'dark' | null;
        theme.value = saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        apply();
    });
    const toggle = () => {
        theme.value = theme.value === 'light' ? 'dark' : 'light';
        localStorage.setItem(KEY, theme.value);
        apply();
    };
    return {theme, toggle};
}