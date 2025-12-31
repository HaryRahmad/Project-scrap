import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../helpers/api';
import Swal from 'sweetalert2';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: location.state.message,
        timer: 3000,
        showConfirmButton: false
      });
    }
  }, [location]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/login', formData);
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      await Swal.fire({
        icon: 'success',
        title: 'Login Berhasil!',
        text: 'Selamat datang kembali',
        timer: 1500,
        showConfirmButton: false
      });
      
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login gagal';
      
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal!',
        text: errorMessage,
        confirmButtonText: 'Coba Lagi',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl justify-center">Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
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
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? <span className="loading loading-spinner"></span> : 'Login'}
          </button>
        </form>

        <p className="text-center mt-4">
          Belum punya akun?{' '}
          <Link to="/register" className="link link-primary">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}

