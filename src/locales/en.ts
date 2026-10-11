import type { appDe } from './de'

export const appEn: typeof appDe = {
  nav: { main: 'Main navigation', today: 'Today', drills: 'Drills', shuffle: 'Random drill', handicap: 'Handicap', progress: 'Progress' },
  header: { settings: 'Settings', tagline: 'Train smarter - play better' },
  settings: {
    title: 'Settings', close: 'Close', save: 'Save', cancel: 'Cancel',
    profile: 'Profile & basics', name: 'Display name', optional: 'Optional',
    hcp: 'Handicap (HCP)', hcpFromRounds: 'Calculated from your rounds (Handicap area).',
    targetHcp: 'Target handicap', targetDate: 'Target date',
    handedness: 'Handedness', right: 'Right-handed', left: 'Left-handed',
    language: 'Language', units: 'Units', metric: 'Metric (m, km/h)', imperial: 'Imperial (yd, mph)',
    appearance: 'Appearance & UX', theme: 'Theme', system: 'System', light: 'Light', dark: 'Dark',
    sounds: 'Sound effects', soundsHint: 'e.g. slot machine',
    favorites: 'Prefer favorites', favoritesHint: 'Shuffle from favorites first',
    notifications: 'Notifications', notificationsHint: 'e.g. training reminders',
  },
}
