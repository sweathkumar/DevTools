import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DevPocketEnterprise from './diffSnap.jsx'
import DiffSnap from './diffSnap.jsx'

createRoot(document.getElementById('root')).render(
  <>
    <DiffSnap />
  </>,
)
