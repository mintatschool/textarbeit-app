import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { registerSW } from 'virtual:pwa-register'
import './index.css'

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

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
