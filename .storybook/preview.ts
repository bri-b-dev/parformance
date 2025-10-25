import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { createPinia } from 'pinia'
import '../src/assets/tailwind.css'
import '../src/assets/theme.css'

// Install Pinia so components that use stores (e.g., favorites) work in Storybook
setup((app) => {
  app.use(createPinia())
})

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    layout: 'centered',
  },
}

export default preview
