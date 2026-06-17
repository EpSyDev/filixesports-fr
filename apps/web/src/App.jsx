
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import EffectifPage from './pages/EffectifPage';
import CompositionPage from './pages/CompositionPage';
import CompetitionPage from './pages/CompetitionPage';
import CompetitionDetail from './pages/CompetitionDetail';
import HistoriquePage from './pages/HistoriquePage';
import StatsJoueursPage from './pages/StatsJoueursPage';
import StatsEquipePage from './pages/StatsEquipePage';
import PalmaresPage from './pages/PalmaresPage';
import MediaPage from './pages/MediaPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="fixed inset-0 -z-10 bg-background/75 pointer-events-none" />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/effectif" element={<EffectifPage />} />
          <Route path="/composition" element={<CompositionPage />} />
          <Route path="/competition" element={<CompetitionPage />} />
          <Route path="/competition/:id" element={<CompetitionDetail />} />
          <Route path="/historique" element={<HistoriquePage />} />
          <Route path="/stats-joueurs" element={<StatsJoueursPage />} />
          <Route path="/stats-equipe" element={<StatsEquipePage />} />
          <Route path="/palmares" element={<PalmaresPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
