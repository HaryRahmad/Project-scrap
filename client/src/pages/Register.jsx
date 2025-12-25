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
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl justify-center">Daftar Akun</h2>
        
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input input-bordered w-full"
              placeholder="email@example.com"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input input-bordered w-full"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Konfirmasi Password</span>
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="input input-bordered w-full"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Telegram Chat ID</span>
              <span className="label-text-alt">(Opsional)</span>
            </label>
            <input
              type="text"
              value={formData.telegramChatId}
              onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
              className="input input-bordered w-full"
              placeholder="123456789"
            />
            <label className="label">
              <span className="label-text-alt">Dapatkan dari @userinfobot di Telegram</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? <span className="loading loading-spinner"></span> : 'Daftar'}
          </button>
        </form>

        <p className="text-center mt-4">
          Sudah punya akun?{' '}
          <Link to="/login" className="link link-primary">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
