import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initGlassSettings } from './utils/theme'

// Khởi tạo cài đặt độ trong suốt và theme nền Liquid Glass từ localStorage
initGlassSettings()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
