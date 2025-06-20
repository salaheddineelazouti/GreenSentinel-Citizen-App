import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';

// Chargement paresseux des pages privées pour optimiser les performances
const IncidentsPage = lazy(() => import('./pages/IncidentsPage'));
const IncidentDetailPage = lazy(() => import('./pages/IncidentDetailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MapPage = lazy(() => import('./pages/MapPage'));

// Composant de chargement global
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Routes privées - protégées par authentification */}
        <Route
          path="/incidents"
          element={
            <PrivateRoute>
              <IncidentsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/incident/:id"
          element={
            <PrivateRoute>
              <IncidentDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/map"
          element={
            <PrivateRoute>
              <MapPage />
            </PrivateRoute>
          }
        />
        
        {/* Redirection par défaut */}
        <Route path="/" element={<Navigate to="/incidents" replace />} />
        
        {/* Route fallback pour les URLs non trouvées */}
        <Route path="*" element={<Navigate to="/incidents" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
