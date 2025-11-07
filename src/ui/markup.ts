// Lightweight HTML markup generators for visual snapshot testing and reuse in simple components.
// These return plain HTML strings (without runtime dependencies) so tests can snapshot them easily.

export function renderSpinner(label: string = 'Laden…'): string {
  return [
    '<div class="flex items-center justify-center p-4" role="status" aria-live="polite" aria-busy="true">',
    '  <span class="inline-block h-5 w-5 mr-2 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin"></span>',
    `  <span class="text-sm text-gray-600">${escapeHtml(label)}</span>`,
    '</div>'
  ].join('\n')
}

export function renderEmptyState(title: string, message?: string): string {
  const heading = `<h3 class=\"text-base font-semibold text-gray-600\">${escapeHtml(title)}</h3>`
  const body = message
    ? `\n  <p class=\"text-sm text-gray-600 mt-1\">${escapeHtml(message)}</p>`
    : ''
  return [
    '<div class="p-6 text-center border border-dashed rounded-md border-gray-200 bg-gray-50">',
    `  ${heading}${body}`,
    '</div>'
  ].join('\n')
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export default { renderSpinner, renderEmptyState }
