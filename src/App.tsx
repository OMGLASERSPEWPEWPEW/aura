// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Upload from './pages/Upload';
import ProfileDetail from './pages/ProfileDetail'; // Import new page
import Mirror from './pages/Mirror';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/profile/:id" element={<ProfileDetail />} />
          <Route path="/mirror" element={<Mirror />} /> {/* Add the route */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;