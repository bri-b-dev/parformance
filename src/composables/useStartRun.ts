import { useRunStore } from '@/stores/run'
import { requestConfirm } from '@/utils/confirmService'
import { useRouter } from 'vue-router'

/** Start a guided session; asks before replacing one that is still in progress, then opens /run. */
export function useStartRun() {
  const run = useRunStore()
  const router = useRouter()

  return async function startRun(input: { title: string; drillIds: string[]; collectionId?: string }): Promise<boolean> {
    if (!run.loaded) await run.load()
    if (run.run && !run.run.finishedAt) {
      if (!(await requestConfirm('Es läuft bereits eine Einheit. Neue Einheit starten und die laufende verwerfen?'))) return false
    }
    if (!run.start(input)) return false
    await router.push({ name: 'Run' })
    return true
  }
}
