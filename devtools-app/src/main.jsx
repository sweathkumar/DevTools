import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import TimeKitEnterprise from '../Pages/TimeKitEnterprise.jsx'
import CSVStudio from '../Pages/CSVStudio.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/timekit" element={<TimeKitEnterprise />} />
      <Route path="/csvstudio" element={<CSVStudio />} />
    </Routes>
  </BrowserRouter>
)
