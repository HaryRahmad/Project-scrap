import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <Link to="/dashboard" className="btn btn-ghost text-xl">
          🏆 <span className="text-primary">Antam Monitor</span>
        </Link>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/settings">Settings</Link></li>
        </ul>
      </div>
      
      <div className="navbar-end gap-2">
        <span className="text-base-content/60 text-sm hidden sm:block">
          {user?.email}
        </span>
        <button onClick={handleLogout} className="btn btn-error btn-sm">
          Logout
        </button>
      </div>
    </div>
  );
}
