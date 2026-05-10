import React from 'react'
import { createRoot } from 'react-dom/client'

import { LandingPage } from './components/landing/landing-page'
import './styles.css'

const rootElement = document.getElementById('root')

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <LandingPage />
    </React.StrictMode>,
  )
}
