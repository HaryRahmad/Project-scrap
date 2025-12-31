import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../helpers/api';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [telegramUsername, setTelegramUsername] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const navigate = useNavigate();

  async function fetchProfile() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await api.get('/api/profile');
      setProfile(response.data.data);
      setTelegramUsername(response.data.data.telegramUsername || '');
    } catch (err) {
      console.error('Error fetching profile:', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleUpdateTelegram(e) {
    e.preventDefault();
    setSavingProfile(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/api/profile', { telegramUsername });
      setMessage({ 
        type: 'success', 
        text: response.data.message 
      });
      
      // Update profile state
      setProfile(prev => ({
        ...prev,
        telegramUsername: response.data.data.telegramUsername,
        telegramLinked: response.data.data.telegramLinked
      }));
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Gagal update profile' 
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Password baru tidak cocok' });
      return;
    }

    setSavingPassword(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/api/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setMessage({ type: 'success', text: 'Password berhasil diubah' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Gagal mengubah password' 
      });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-base-content/60">Kelola akun dan notifikasi Telegram Anda</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <span>{message.text}</span>
        </div>
      )}

      {/* Account Info */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-lg">👤 Informasi Akun</h2>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between py-2 border-b border-base-200">
              <span className="text-base-content/60">Email</span>
              <span className="font-medium">{profile?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-base-content/60">Bergabung</span>
              <span className="font-medium">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('id-ID') : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Telegram */}
      <form onSubmit={handleUpdateTelegram} className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-lg">📱 Telegram</h2>
            {profile?.telegramLinked ? (
              <span className="badge badge-success gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Terhubung
              </span>
            ) : (
              <span className="badge badge-warning">Belum terhubung</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Username Telegram</span>
            </label>
            <label className="input input-bordered flex items-center gap-2">
              <span className="text-info font-bold">@</span>
              <input
                type="text"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value.replace('@', ''))}
                className="grow bg-transparent border-none outline-none"
                placeholder="username"
              />
            </label>
            <label className="label">
              <span className="label-text-alt">
                {profile?.telegramLinked 
                  ? 'Telegram terhubung - Anda akan menerima notifikasi' 
                  : 'Kirim /start ke bot Telegram setelah menyimpan username'}
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="btn btn-primary"
          >
            {savingProfile ? <span className="loading loading-spinner"></span> : 'Simpan Telegram'}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <h2 className="card-title text-lg">🔒 Ubah Password</h2>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Password Saat Ini</span>
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="input input-bordered w-full"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Password Baru</span>
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="input input-bordered w-full"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Konfirmasi Password Baru</span>
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="input input-bordered w-full"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="btn btn-outline btn-primary"
          >
            {savingPassword ? <span className="loading loading-spinner"></span> : 'Ubah Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
