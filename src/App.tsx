// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Upload from './pages/Upload';
import ProfileDetail from './pages/ProfileDetail';
import MyProfile from './pages/MyProfile';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/profile/:id" element={<ProfileDetail />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/settings" element={<Settings />} />
          {/* Alias for backward compatibility */}
          <Route path="/mirror" element={<MyProfile />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;