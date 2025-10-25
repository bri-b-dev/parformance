import type { Meta, StoryObj } from '@storybook/vue3'
import Timer from './Timer.vue'

const meta: Meta<typeof Timer> = {
  title: 'Components/Timer',
  component: Timer,
  args: {
    seconds: 300,
  },
  argTypes: {
    seconds: { control: { type: 'number', min: 0, step: 5 } },
  }
}

export default meta

type Story = StoryObj<typeof Timer>

export const Default: Story = {}

export const OneMinute: Story = { args: { seconds: 60 } }

export const TenSeconds: Story = { args: { seconds: 10 } }
