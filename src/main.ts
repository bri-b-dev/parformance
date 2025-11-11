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

app.mount('#app');