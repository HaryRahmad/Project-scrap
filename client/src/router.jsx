import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Check authentication from localStorage
function isAuthenticated() {
  return !!localStorage.getItem('access_token');
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Public route (redirect if authenticated)
function PublicRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <PublicRoute><Login /></PublicRoute>
      },
      {
        path: '/register',
        element: <PublicRoute><Register /></PublicRoute>
      }
    ]
  },
  {
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />
      },
      {
        path: '/settings',
        element: <Settings />
      },
      {
        path: '/profile',
        element: <Profile />
      }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

export default router;

