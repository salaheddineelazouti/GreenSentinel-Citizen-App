import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user, getToken } = useAuth();
  const location = useLocation();
  const token = getToken();

  console.log('🔑 PrivateRoute: Vérification de l\'authentification', { 
    isAuthenticated, 
    isLoading,
    user,
    pathname: location.pathname,
    tokenPrésent: !!token
  });

  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log('🔑 PrivateRoute: Chargement en cours...');
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated, preserving the attempted URL
  if (!isAuthenticated) {
    console.log('🔑 PrivateRoute: Non authentifié, redirection vers login', {
      user,
      location: location.pathname,
      token: token ? '(tronqué pour sécurité)' : 'Absent'
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('🔑 PrivateRoute: Authentifié, affichage du contenu protégé', {
    email: user?.email,
    exp: user?.exp ? new Date(user.exp * 1000).toLocaleString() : 'inconnu'
  });
  return <>{children}</>;
};

export default PrivateRoute;
