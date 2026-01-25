// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
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
    <BrowserRouter>
      <AuthProvider>
        <SyncProvider>
          <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Routes>
              {/* Public auth routes - no login required */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected routes - require authentication */}
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/profile/:id" element={<ProtectedRoute><ProfileDetail /></ProtectedRoute>} />
              <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="/mirror" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
            </Routes>
          </div>
        </SyncProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
