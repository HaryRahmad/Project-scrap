import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../helpers/api';

export default function Register() {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    telegramChatId: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/register', {
        email: formData.email,
        password: formData.password,
        telegramChatId: formData.telegramChatId || null
      });
      
      navigate('/login', { state: { message: 'Registrasi berhasil! Silakan login.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Daftar Akun</h2>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
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
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Konfirmasi Password</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Telegram Chat ID <span className="text-gray-500">(Opsional)</span>
          </label>
          <input
            type="text"
            value={formData.telegramChatId}
            onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
            placeholder="123456789"
          />
          <p className="text-gray-500 text-xs mt-1">
            Dapatkan dari @userinfobot di Telegram
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-gray-900 font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Daftar'}
        </button>
      </form>

      <p className="text-gray-400 text-center mt-6">
        Sudah punya akun?{' '}
        <Link to="/login" className="text-gold-400 hover:text-gold-300">
          Login
        </Link>
      </p>
    </div>
  );
}
