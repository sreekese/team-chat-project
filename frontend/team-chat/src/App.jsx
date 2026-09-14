import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ChannelView } from './pages/ChannelView'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Workspaces } from './pages/Workspaces'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/workspaces" replace />} />
        <Route path="/workspaces" element={<Workspaces />} />
        <Route path="/workspaces/:workspaceId" element={<ChannelView />} />
        <Route
          path="/workspaces/:workspaceId/channels/:channelId"
          element={<ChannelView />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App