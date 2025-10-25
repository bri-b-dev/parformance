import type { Meta, StoryObj } from '@storybook/vue3'
import CategoryScoresChart from './CategoryScoresChart.vue'

const scores = {
  'Putting Green': 100,
  'Chipping Green': 33,
  'Driving Range': 67,
}

const meta: Meta<typeof CategoryScoresChart> = {
  title: 'Components/CategoryScoresChart',
  component: CategoryScoresChart,
  args: {
    scores,
    title: 'Fähigkeiten je Kategorie (0–100)'
  },
}

export default meta

type Story = StoryObj<typeof CategoryScoresChart>

export const Bars: Story = {
  args: { mode: 'bar' },
}

export const Radar: Story = {
  args: { mode: 'radar' },
}
