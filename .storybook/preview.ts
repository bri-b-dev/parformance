import type { Preview } from '@storybook/vue3'
import '../src/assets/tailwind.css'
import '../src/assets/theme.css'

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    layout: 'centered',
  },
}

export default preview
