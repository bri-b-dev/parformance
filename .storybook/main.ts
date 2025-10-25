import type { StorybookConfig } from '@storybook/vue3-vite'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  framework: {
    name: '@storybook/vue3-vite',
  },
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-essentials',
  ],
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    // Filter out dev-only Vite plugins that break under Storybook's builder-vite
    // Specifically: vite-plugin-vue-devtools and vite-plugin-inspect
    const filteredPlugins = (config.plugins ?? []).filter((p: any) => {
      const name = (p && (p as any).name) ? String((p as any).name) : ''
      return !/vite-plugin-vue-devtools|inspect/i.test(name)
    })

    return mergeConfig({ ...config, plugins: filteredPlugins }, {
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('../src', import.meta.url)),
        },
      },
    })
  },
}

export default config
