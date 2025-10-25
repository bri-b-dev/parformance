import {fileURLToPath, URL} from 'node:url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const isStorybook = process.env.STORYBOOK === 'true'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        // Exclude vue-devtools (and its inspect plugin) when running under Storybook
        ...(!isStorybook ? [vueDevTools()] : []),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
})
