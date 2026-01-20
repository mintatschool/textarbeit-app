import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { registerSW } from 'virtual:pwa-register'
import './index.css'

try {
    const updateSW = registerSW({
        onNeedRefresh() {
            if (confirm('Neue Inhalte verfügbar. Neu laden?')) {
                updateSW(true)
            }
        },
        onOfflineReady() {
            console.log('App is ready for offline work')
        },
    })
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
