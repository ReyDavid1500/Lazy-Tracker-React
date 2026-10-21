import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'

import { AuthProvider } from '@/store/auth'
import { ToastProvider } from '@/store/toast'
import { ProtectedRoute } from '@/components/protected-route'
import { Layout } from '@/components/layout'
import { ErrorBoundary } from '@/components/error-boundary'

import { LoginPage } from '@/pages/login-page'
import { ScanPage } from '@/pages/scan-page'
import { ProductsPage } from '@/pages/products-page'
import { ProfilePage } from '@/pages/profile-page'
import { ConfirmPage } from '@/pages/confirm-page'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      throwOnError: false,  // never propagate query errors to the React tree
    },
    mutations: {
      throwOnError: false,
    },
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
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/scan" replace />} />
                <Route
                  path="scan"
                  element={<ErrorBoundary><ScanPage /></ErrorBoundary>}
                />
                <Route
                  path="products"
                  element={<ErrorBoundary><ProductsPage /></ErrorBoundary>}
                />
                <Route
                  path="profile"
                  element={<ErrorBoundary><ProfilePage /></ErrorBoundary>}
                />
              </Route>
              <Route
                path="/confirm"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary><ConfirmPage /></ErrorBoundary>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
