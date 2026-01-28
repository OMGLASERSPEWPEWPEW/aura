// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary, RouteErrorBoundary } from './components/errors';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProtectedLayout from './components/layout/ProtectedLayout';
import Home from './pages/Home';
import Upload from './pages/Upload';
import ProfileDetail from './pages/ProfileDetail';
import MyProfile from './pages/MyProfile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <ErrorBoundary level="page" componentName="App">
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <SyncProvider>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans">
                <Routes>
                  {/* Public auth routes - no login required */}
                  <Route path="/login" element={<RouteErrorBoundary routeName="Login"><Login /></RouteErrorBoundary>} />
                  <Route path="/signup" element={<RouteErrorBoundary routeName="Signup"><Signup /></RouteErrorBoundary>} />
                  <Route path="/forgot-password" element={<RouteErrorBoundary routeName="ForgotPassword"><ForgotPassword /></RouteErrorBoundary>} />
                  <Route path="/reset-password" element={<RouteErrorBoundary routeName="ResetPassword"><ResetPassword /></RouteErrorBoundary>} />

                  {/* Protected routes - require authentication */}
                  <Route path="/" element={<ProtectedRoute><ProtectedLayout><RouteErrorBoundary routeName="Home"><Home /></RouteErrorBoundary></ProtectedLayout></ProtectedRoute>} />
                  <Route path="/profile/:id" element={<ProtectedRoute><ProtectedLayout><RouteErrorBoundary routeName="ProfileDetail"><ProfileDetail /></RouteErrorBoundary></ProtectedLayout></ProtectedRoute>} />
                  <Route path="/my-profile" element={<ProtectedRoute><ProtectedLayout><RouteErrorBoundary routeName="MyProfile"><MyProfile /></RouteErrorBoundary></ProtectedLayout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><ProtectedLayout><RouteErrorBoundary routeName="Settings"><Settings /></RouteErrorBoundary></ProtectedLayout></ProtectedRoute>} />
                  <Route path="/upload" element={<ProtectedRoute><ProtectedLayout><RouteErrorBoundary routeName="Upload"><Upload /></RouteErrorBoundary></ProtectedLayout></ProtectedRoute>} />
                  <Route path="/mirror" element={<ProtectedRoute><ProtectedLayout><RouteErrorBoundary routeName="Mirror"><MyProfile /></RouteErrorBoundary></ProtectedLayout></ProtectedRoute>} />
                </Routes>
                </div>
              </SyncProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
