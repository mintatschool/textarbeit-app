import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { registerSW } from 'virtual:pwa-register'
import './index.css'

// App Version Identifier (Updated: 2026-02-16 21:00)
const APP_VERSION = '2026-02-16-v1';
console.log(`🚀 App Version: ${APP_VERSION}`);

try {
    const updateSW = registerSW({
        // When a new SW is found and ready, automatically reload to activate it
        onNeedRefresh() {
            console.log('🔄 New version available — updating automatically...');
            updateSW(true); // true = force reload with new SW
        },
        onOfflineReady() {
            console.log('✅ App is ready for offline work');
        },
        // Check for updates on registration (every page load)
        immediate: true,
    })

    // Check for updates when the user returns to the tab (e.g., switches back from another app)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('👁️ Tab visible — checking for updates...');
            updateSW(false); // false = just check, onNeedRefresh will handle reload
        }
    });

    // Also check periodically (every 60 minutes) in case the tab stays open
    setInterval(() => {
        console.log('⏰ Periodic update check...');
        updateSW(false);
    }, 60 * 60 * 1000);

} catch (e) {
    console.warn('PWA Service Worker registration failed (expected in HTTP mode):', e)
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
