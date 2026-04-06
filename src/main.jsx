import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// iTenant: force light mode permanently — dark mode is disabled
document.documentElement.classList.remove('dark')
document.documentElement.setAttribute('data-theme', 'light')

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)