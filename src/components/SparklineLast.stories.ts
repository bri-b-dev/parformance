import type { Meta, StoryObj } from '@storybook/vue3'
import SparklineLast from './SparklineLast.vue'

const meta: Meta<typeof SparklineLast> = {
  title: 'Components/SparklineLast',
  component: SparklineLast,
  args: {
    limit: 10,
    width: 160,
    height: 32,
    color: '#2F7A52',
  },
}

export default meta
type Story = StoryObj<typeof SparklineLast>

export const FromValues: Story = {
  args: {
    values: [1,2,3,4,5,6,7,8,9,10,11,12,13],
  }
}

export const FromSessions: Story = {
  args: {
    sessions: Array.from({ length: 14 }).map((_, i) => ({ id: `s${i}`, result: { value: Math.round(Math.random() * 12) } })),
  }
}

export const FewPoints: Story = {
  args: {
    values: [5],
  }
}
