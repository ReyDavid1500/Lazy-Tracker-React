import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'

import { AuthProvider } from '@/store/auth'
import { ToastProvider } from '@/store/toast'
import { ProtectedRoute } from '@/components/protected-route'
import { Layout } from '@/components/layout'

import { LoginPage } from '@/pages/login-page'
import { ScanPage } from '@/pages/scan-page'
import { ProductsPage } from '@/pages/products-page'
import { ProfilePage } from '@/pages/profile-page'
import { ConfirmPage } from '@/pages/confirm-page'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/scan" replace />} />
                <Route path="scan" element={<ScanPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
              <Route path="/confirm" element={<ProtectedRoute><ConfirmPage /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
