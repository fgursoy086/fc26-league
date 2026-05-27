import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import { ForgotPassword, ResetPassword } from './pages/PasswordPages'
import Dashboard from './pages/Dashboard'
import CreateTeam from './pages/CreateTeam'
import { SquadPage, ManageTeam } from './pages/Team'
import Contracts from './pages/Contracts'
import { Standings, Players, Matches } from './pages/PublicPages'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'
import './styles.css'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner">⚽</div></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner">⚽</div></div>
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppLayout({ children }) {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
      <Route path="/team/create" element={<PrivateRoute><AppLayout><CreateTeam /></AppLayout></PrivateRoute>} />
      <Route path="/team/squad" element={<PrivateRoute><AppLayout><SquadPage /></AppLayout></PrivateRoute>} />
      <Route path="/team/:teamId" element={<PrivateRoute><AppLayout><SquadPage /></AppLayout></PrivateRoute>} />
      <Route path="/team/manage" element={<PrivateRoute><AppLayout><ManageTeam /></AppLayout></PrivateRoute>} />
      <Route path="/contracts" element={<PrivateRoute><AppLayout><Contracts /></AppLayout></PrivateRoute>} />
      <Route path="/standings" element={<PrivateRoute><AppLayout><Standings /></AppLayout></PrivateRoute>} />
      <Route path="/players" element={<PrivateRoute><AppLayout><Players /></AppLayout></PrivateRoute>} />
      <Route path="/matches" element={<PrivateRoute><AppLayout><Matches /></AppLayout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AppLayout><AdminPanel /></AppLayout></PrivateRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1a1a2e', color: '#eee', border: '1px solid #333' }
        }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
