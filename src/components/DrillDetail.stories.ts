import type { Meta, StoryObj } from '@storybook/vue3'
import DrillDetail from './DrillDetail.vue'
import type { Drill } from '@/types'

const sample: Drill = {
  id: 'range_14_fairways',
  title: '14 Fairways',
  category: 'Driving Range',
  equipment: { balls: 28, clubs: ['Driver', 'Eisen 7'] },
  setup: { schema: 'Zielkorridor >30 m Breite, 14 Driver + 14 Eisen', location: 'Range' },
  duration: { suggestedMin: 20, timerPreset: 1200 },
  instructions: {
    training: 'Je 14 Bälle mit Driver/Eisen in den Korridor. Zähle nur Treffer.',
    tooEasy: 'Flugkurven variieren, Korridor schmaler.'
  },
  metric: { type: 'corridor_hits', unit: 'Treffer', hcpTargets: {} },
  tags: ['Abschlag', 'Richtungskontrolle'],
}

const meta: Meta<typeof DrillDetail> = {
  title: 'Components/DrillDetail',
  component: DrillDetail,
  args: { drill: sample },
}

export default meta

type Story = StoryObj<typeof DrillDetail>

export const Default: Story = {}

export const WithTestAndDifficulty: Story = {
  args: {
    drill: {
      ...sample,
      title: 'Carry Zone',
      id: 'chip_carry_zone',
      category: 'Chipping Green',
      duration: { suggestedMin: 5, timerPreset: 300 },
      instructions: {
        training: 'Abwechselnd kurz→lang die Carry-Zonen treffen. Längste fehlerfreie Serie zählt.',
        test: 'Höchstserie in 5 Min.',
        tooEasy: 'Nach jedem Schlag Schläger wechseln oder Bänder enger.'
      },
      metric: { type: 'streak', unit: 'Zonen in Serie', hcpTargets: {} },
      // @ts-ignore add difficulty for preview UI only
      difficulty: { base: 3, scale: '1-5' },
    } as Drill
  }
}
