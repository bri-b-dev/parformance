import type { Meta, StoryObj } from '@storybook/vue3'
import MetricValueInput from './MetricValueInput.vue'
import type { Drill, MetricType } from '@/types'

function makeDrill(type: MetricType, unit: string): Drill {
  return {
    id: `d_${type}`,
    title: `Drill ${type}`,
    category: 'Test',
    equipment: {},
    setup: { schema: 'x' },
    duration: {},
    instructions: { training: 'do it' },
    metric: { type, unit, hcpTargets: {} },
  }
}

const meta: Meta<typeof MetricValueInput> = {
  title: 'Components/MetricValueInput',
  component: MetricValueInput,
  render: (args) => ({ components: { MetricValueInput }, setup: () => ({ args }), template: '<MetricValueInput v-bind="args" />' }),
}

export default meta

type Story = StoryObj<typeof MetricValueInput>

export const StreakInvalid: Story = {
  args: {
    drill: makeDrill('streak', 'Putts in Folge'),
    modelValue: 0, // invalid: must be > 0
  }
}

export const CountInTimeInvalid: Story = {
  args: {
    drill: makeDrill('count_in_time', 'Treffer in 60s'),
    modelValue: 0, // invalid: must be > 0
  }
}

export const PointsTotalInvalid: Story = {
  args: {
    drill: makeDrill('points_total', 'Punkte'),
    modelValue: -1, // invalid: must be >= 0
  }
}

export const StationsClearedInvalid: Story = {
  args: {
    drill: makeDrill('stations_cleared', 'Stationen'),
    modelValue: -1, // invalid
  }
}

export const CorridorHitsInvalid: Story = {
  args: {
    drill: makeDrill('corridor_hits', 'Treffer'),
    modelValue: -1, // invalid
  }
}

export const ScoreVsParInvalid: Story = {
  args: {
    drill: makeDrill('score_vs_par', 'Score vs Par'),
    modelValue: 1.5, // invalid: must be integer
  }
}
