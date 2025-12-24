import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../helpers/api';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for success message from registration
    if (location.state?.message) {
      setSuccess(location.state.message);
    }
  }, [location]);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/login', formData);
      
      // Save token to localStorage
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Login</h2>
      
      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
            placeholder="email@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-gray-900 font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>

      <p className="text-gray-400 text-center mt-6">
        Belum punya akun?{' '}
        <Link to="/register" className="text-gold-400 hover:text-gold-300">
          Daftar
        </Link>
      </p>
    </div>
  );
}
