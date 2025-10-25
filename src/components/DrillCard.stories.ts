import type { Meta, StoryObj } from '@storybook/vue3'
import DrillCard from './DrillCard.vue'
import type { Drill } from '@/types'

const meta: Meta<typeof DrillCard> = {
  title: 'Components/DrillCard',
  component: DrillCard,
  args: {
    drill: {
      id: 'chip_carry_zone',
      title: 'Carry Zone',
      category: 'Chipping Green',
      equipment: { balls: 6, clubs: ['Wedge'] },
      setup: { schema: '6 Landebänder im Meterabstand' },
      duration: { suggestedMin: 5, timerPreset: 300 },
      instructions: { training: 'Abwechselnd kurz→lang die Carry-Zonen treffen.' },
      metric: { type: 'streak', unit: 'Zonen in Serie', hcpTargets: {} },
      tags: ['Längenkontrolle', 'Kontakt'],
      difficulty: { base: 3, scale: '1-5' },
    } as Drill,
  },
}

export default meta

type Story = StoryObj<typeof DrillCard>

export const Default: Story = {}
