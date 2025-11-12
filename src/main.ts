import {createApp} from 'vue';
import {createPinia} from 'pinia';
import App from './App.vue';
import router from './router';
import '@/assets/tailwind.css';
import '@/assets/theme.css'

// Capacitor status bar handling: ensure native status bar does not overlay the WebView
// This prevents the header from being hidden behind the OS status bar on Android/iOS.
import { Capacitor } from '@capacitor/core'

async function ensureStatusBar() {
	try {
		if (Capacitor.isNativePlatform()) {
			// Dynamically import StatusBar plugin to avoid compile-time errors when
			// the plugin is not installed in web-only environments.
			// use an indirect dynamic import to avoid TypeScript trying to resolve the
			// module at compile time in web-only builds.
			// eslint-disable-next-line no-new-func
			const dynamicImport = new Function('s', 'return import(s)') as (s: string) => Promise<any>
			const mod = await dynamicImport('@capacitor/status-bar').catch(() => null)
			const StatusBar = mod?.StatusBar
			if (!StatusBar) return
			// Disable overlay so the webview content is laid out below the status bar
			await StatusBar.setOverlaysWebView({ overlay: false })
			// Optionally set a background color matching the app header surface
			await StatusBar.setBackgroundColor({ color: '#141A16' }).catch(() => {})
		}
	} catch (e) {
		// ignore if plugin not installed or call fails
		console.debug('StatusBar init failed', e)
	}
}

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Initialize native UI tweaks, then mount app. Don't await in module top-level blocking UI,
// but call and continue; mounting immediately is fine — the StatusBar call will adjust
// window insets on native platforms shortly after startup.
ensureStatusBar()

// Handle Android hardware back button to navigate within the SPA instead of
// letting the OS close the app. We dynamically import the Capacitor App
// plugin to avoid compile-time errors in web-only builds.
async function ensureBackButtonHandling() {
	try {
		if (!Capacitor.isNativePlatform()) return
		// indirect dynamic import to avoid bundlers resolving this for web
		// eslint-disable-next-line no-new-func
		const dynamicImport = new Function('s', 'return import(s)') as (s: string) => Promise<any>
		const mod = await dynamicImport('@capacitor/app').catch(() => null)
		const AppPlugin = mod?.App
		if (!AppPlugin || typeof AppPlugin.addListener !== 'function') return

		// Wait until router is ready so currentRoute is reliable
		router.isReady().then(() => {
			AppPlugin.addListener('backButton', () => {
				try {
					const route = router.currentRoute.value
					// If we're viewing a drill detail, navigate to the drills list explicitly
					if (route.name === 'DrillDetail') {
						router.push({ name: 'DrillsList' })
						return
					}

					// Otherwise, if there's history, go back, else exit the app
					if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
						router.back()
						return
					}

					// No history to go back to — let the OS handle exiting the app
					if (typeof AppPlugin.exitApp === 'function') {
						AppPlugin.exitApp()
					}
				} catch (e) {
					console.debug('backButton handler error', e)
				}
			})
		})
	} catch (e) {
		console.debug('Back button handler initialization failed', e)
	}
}

ensureBackButtonHandling()

app.mount('#app');