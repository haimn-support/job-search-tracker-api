
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './providers';
import { LoginPage, RegisterPage, DashboardPage, PositionsPage, CreatePositionPage, EditPositionPage, PositionDetailsPage, StatisticsPage } from './pages';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/positions" element={<PositionsPage />} />
          <Route path="/positions/create" element={<CreatePositionPage />} />
          <Route path="/positions/:id" element={<PositionDetailsPage />} />
          <Route path="/positions/:id/edit" element={<EditPositionPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
