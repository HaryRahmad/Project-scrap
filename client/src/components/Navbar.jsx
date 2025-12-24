import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl">🏆</span>
            <span className="text-xl font-bold text-gold-400">Antam Monitor</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-6">
            <Link 
              to="/dashboard" 
              className="text-gray-300 hover:text-gold-400 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/settings" 
              className="text-gray-300 hover:text-gold-400 transition-colors"
            >
              Settings
            </Link>
            
            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm hidden sm:block">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
