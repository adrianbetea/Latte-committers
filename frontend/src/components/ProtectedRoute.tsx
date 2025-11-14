import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = localStorage.getItem('auth') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // change to /login after you finish login functionality on backend
  return <>{children}</>;
};

export default ProtectedRoute;
