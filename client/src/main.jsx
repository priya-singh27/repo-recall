import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {AuthProvider} from './context/AuthContext.jsx'
import {BrowserRouter} from 'react-router'
import { RepoProvider } from './context/RepoContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <AuthProvider>
        <RepoProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RepoProvider>
      </AuthProvider>
  </StrictMode>,
)
