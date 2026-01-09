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
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      
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
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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

  function handleLogout() {
    localStorage.removeItem('access_token');
    navigate('/login');
  }

  if (loading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/50">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="pb-20 max-w-xl mx-auto space-y-6">


      <div className="px-4 lg:px-0 flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold hidden lg:block mb-2">Profile</h1>
          <p className="text-base-content/60 hidden lg:block">Kelola akun Anda</p>
        </div>
        <button onClick={handleLogout} className="btn btn-outline btn-error hidden lg:flex gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
           Logout
        </button>
      </div>

      {message.text && (
        <div className={`toast toast-top toast-center z-50`}>
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
             <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Account Info Card */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body items-center text-center py-8">
            <div className="avatar placeholder mb-4">
              <div className="bg-neutral text-neutral-content rounded-full w-24">
                <span className="text-3xl">{profile?.email?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <h2 className="card-title text-xl">{profile?.email}</h2>
            <p className="text-base-content/60 text-sm">Member sejak {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('id-ID') : '-'}</p>
        </div>
      </div>

      {/* Telegram Card */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <form onSubmit={handleUpdateTelegram} className="card-body p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="card-title text-base flex items-center gap-2">
              <span className="text-xl">📱</span> Telegram
            </h2>
            {profile?.telegramLinked ? (
              <div className="badge badge-success gap-1 py-3 px-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Terhubung
              </div>
            ) : (
              <div className="badge badge-warning py-3 px-3">Belum Hubung</div>
            )}
          </div>
          
          <p className="text-sm text-base-content/70 mb-4">
            Hubungkan akun Telegram untuk menerima notifikasi real-time saat stok emas tersedia.
          </p>

          <div className="join w-full">
            <div className="flex items-center justify-center bg-base-200 px-4 border border-base-300 rounded-l-btn">
               <span className="font-bold text-base-content/70">@</span>
            </div>
            <input
              type="text"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value.replace('@', ''))}
              className="input input-bordered join-item w-full"
              placeholder="Username Telegram..."
            />
            <button 
              type="submit" 
              className="btn btn-primary join-item"
              disabled={savingProfile}
            >
              {savingProfile ? <span className="loading loading-spinner"></span> : 'Simpan'}
            </button>
          </div>
          
           {!profile?.telegramLinked && telegramUsername && (
              <div className="alert alert-info mt-4 text-xs py-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Simpan username, lalu kirim <b>/start</b> ke bot kami di Telegram.</span>
              </div>
            )}
        </form>
      </div>

      {/* Security Accordion */}
      <div className="collapse collapse-arrow bg-base-100 shadow-sm border border-base-200">
        <input type="checkbox" /> 
        <div className="collapse-title text-base font-medium flex items-center gap-2">
          <span className="text-xl">🔒</span> Keamanan Akun
        </div>
        <div className="collapse-content"> 
           <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
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
                <span className="label-text">Konfirmasi</span>
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
              className="btn btn-outline w-full mt-4"
            >
              {savingPassword ? <span className="loading loading-spinner"></span> : 'Ubah Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
