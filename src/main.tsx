import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { BackendProvider } from './api/backend'
import { CapabilitiesProvider } from './api/capabilities'
import './i18n'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BackendProvider>
        <CapabilitiesProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CapabilitiesProvider>
      </BackendProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
