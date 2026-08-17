import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import UploadForm from './components/UploadForm.jsx';
import Notifications from './components/Notifications.jsx';
import Home from './pages/Home.jsx';
import Features from './pages/Features.jsx';
import Explorer from './pages/Explorer.jsx';
import Records from './pages/Records.jsx';
import About from './pages/About.jsx';
import Contracts from './pages/Contracts.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NotFound from './pages/NotFound.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './AuthContext.jsx';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="app-shell">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/explorer" element={<Explorer />} />
              <Route path="/records" element={<ProtectedRoute><Records /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><UploadForm /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
