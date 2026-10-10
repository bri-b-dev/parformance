import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clearKey, EMPTY_FILTER, FILTER_QUERY_KEYS, filterToQuery, parseFilter, type CatalogFilter } from '@/filters/catalog'
import { useUiStore } from '@/stores/ui'

/**
 * The catalog filter lives in the URL (`?q=&cat=&tag=&dur=&diff=&place=&fav=1&new=1&low=1`):
 * it can be shared and survives going to a drill and back. Changes replace the history entry,
 * so Back leaves the list instead of walking through every filter step.
 */
export function useCatalogFilter(debounceMs = 200) {
  const route = useRoute()
  const router = useRouter()
  const ui = useUiStore()

  const filter = computed<CatalogFilter>(() => parseFilter(route.query))

  // the text field keeps what is typed; the URL follows shortly after
  const searchText = ref(filter.value.q)
  let timer: ReturnType<typeof setTimeout> | null = null

  // URL -> field (back/forward, chip removal, reset)
  watch(() => filter.value.q, (q) => { if (q !== searchText.value.trim()) searchText.value = q })

  // the shuffle overlay starts from the list's category and tag
  watch(() => [filter.value.category, filter.value.tag], ([cat, tag]) => {
    ui.setActiveCategory(cat)
    ui.setActiveTag(tag)
  }, { immediate: true })

  // router.replace is asynchronous: changes made before the URL has caught up must build on each other
  let pending: CatalogFilter | null = null
  watch(() => route.query, () => { pending = null })

  function write(next: CatalogFilter) {
    pending = next
    const rest = Object.fromEntries(Object.entries(route.query).filter(([k]) => !FILTER_QUERY_KEYS.includes(k)))
    void router.replace({ query: { ...rest, ...filterToQuery(next) } })
  }

  const base = () => pending ?? filter.value

  function update(patch: Partial<CatalogFilter>) {
    write({ ...base(), ...patch })
  }

  function clear(key: keyof CatalogFilter) {
    if (key === 'q') searchText.value = ''
    write(clearKey(base(), key))
  }

  function reset() {
    searchText.value = ''
    write({ ...EMPTY_FILTER })
  }

  function onSearchInput() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => update({ q: searchText.value.trim() }), debounceMs)
  }

  /** Apply the pending search right away (Enter, or before leaving). */
  function flushSearch() {
    if (timer) { clearTimeout(timer); timer = null }
    if (searchText.value.trim() !== filter.value.q) update({ q: searchText.value.trim() })
  }

  onBeforeUnmount(() => { if (timer) clearTimeout(timer) })

  return { filter, searchText, update, clear, reset, onSearchInput, flushSearch }
}
