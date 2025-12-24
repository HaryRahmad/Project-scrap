import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold-400">🏆 Antam Monitor</h1>
          <p className="text-gray-400 mt-2">Pantau Stok Emas Real-time</p>
        </div>
        
        {/* Content */}
        <Outlet />
      </div>
    </div>
  );
}
