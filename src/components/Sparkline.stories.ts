import type { Meta, StoryObj } from '@storybook/vue3'
import Sparkline from './Sparkline.vue'

const meta: Meta<typeof Sparkline> = {
  title: 'Components/Sparkline',
  component: Sparkline,
  args: {
    data: [2, 4, 3, 6, 8, 7, 9, 12, 10, 13],
    width: 160,
    height: 32,
    color: '#2F7A52',
  },
}

export default meta

type Story = StoryObj<typeof Sparkline>

export const Default: Story = {}

export const Increasing: Story = {
  args: { data: [1,2,3,4,5,6,7,8,9,10], color: '#4FBF86' }
}

export const Volatile: Story = {
  args: { data: [8,3,10,2,9,4,11,1,12,5], color: '#A7D8FF' }
}

export const Flat: Story = {
  args: { data: [5,5,5,5,5,5,5,5], color: '#888888' }
}
