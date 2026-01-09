import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../helpers/api';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [boutiques, setBoutiques] = useState([]);
  const [weightOptions, setWeightOptions] = useState([]);
  const [formData, setFormData] = useState({
    locationId: '',
    locationName: '',
    targetWeights: [],
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  async function fetchData() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const [settingsRes, boutiquesRes, weightsRes] = await Promise.all([
        api.get('/api/settings').catch(() => ({ data: { data: null } })),
        api.get('/api/master/boutiques'),
        api.get('/api/master/weights')
      ]);

      setBoutiques(boutiquesRes.data.data || []);
      setWeightOptions(weightsRes.data.data || []);
      
      if (settingsRes.data.data) {
        const s = settingsRes.data.data;
        setSettings(s);
        setFormData({
          locationId: s.locationId || '',
          locationName: s.locationName || '',
          targetWeights: s.targetWeights || [],
          isActive: s.isActive ?? true
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function handleLocationChange(e) {
    const locationId = e.target.value;
    const boutique = boutiques.find(b => b.locationId === locationId);
    setFormData({
      ...formData,
      locationId,
      locationName: boutique?.name || ''
    });
  }

  function handleWeightToggle(weight) {
    const weights = formData.targetWeights.includes(weight)
      ? formData.targetWeights.filter(w => w !== weight)
      : [...formData.targetWeights, weight];
    setFormData({ ...formData, targetWeights: weights });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/api/settings', formData);
      setMessage({ type: 'success', text: 'Preferensi berhasil disimpan' });
      // Clear success message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Gagal menyimpan settings' 
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/50">Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="pb-20 max-w-xl mx-auto space-y-6">
      <div className="px-4 lg:px-0">
        <h1 className="text-2xl font-bold hidden lg:block mb-2">Settings</h1>
        <p className="text-base-content/60 hidden lg:block">Sesuaikan preferensi monitoring Anda</p>
      </div>

      {message.text && (
        <div className={`toast toast-top toast-center z-50`}>
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
             <span>{message.text}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Status Card */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-4 sm:p-6">
            <div className="form-control">
              <label className="label cursor-pointer justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${formData.isActive ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/40'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                  <div>
                    <span className="font-semibold block text-lg">Monitoring Aktif</span>
                    <span className="text-sm text-base-content/60">Terima notifikasi Telegram saat tersedia</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-lg"
                  checked={formData.isActive}
                  onChange={() => setFormData({ ...formData, isActive: !formData.isActive })}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Location Card */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
           <div className="card-body p-4 sm:p-6">
            <h2 className="card-title text-base mb-4 flex items-center gap-2">
              <span className="text-xl">📍</span> Lokasi Butik
            </h2>
            <select
              value={formData.locationId}
              onChange={handleLocationChange}
              className="select select-bordered w-full select-lg text-base"
            >
              <option value="">Pilih lokasi...</option>
              {boutiques.map(boutique => (
                <option key={boutique.locationId} value={boutique.locationId}>
                  {boutique.city} - {boutique.name}
                </option>
              ))}
            </select>
            <div className="label">
              <span className="label-text-alt text-base-content/60">Pilih lokasi Antam terdekat untuk dipantau</span>
            </div>
          </div>
        </div>

        {/* Weights Card */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-4 sm:p-6">
             <h2 className="card-title text-base mb-4 flex items-center gap-2">
              <span className="text-xl">⚖️</span> Filter Berat
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {weightOptions.map(w => (
                <button
                  key={w.weightLabel}
                  type="button"
                  onClick={() => handleWeightToggle(w.weightLabel)}
                  className={`btn h-auto py-3 px-2 flex flex-col gap-1 border-opacity-20 ${
                    formData.targetWeights.includes(w.weightLabel)
                      ? 'btn-primary border-primary'
                      : 'btn-ghost bg-base-200/50 hover:bg-base-200'
                  }`}
                >
                  <span className={`text-lg font-bold ${formData.targetWeights.includes(w.weightLabel) ? 'text-white' : ''}`}>
                    {w.weightLabel}
                  </span>
                </button>
              ))}
            </div>
            <div className="label">
              <span className="label-text-alt text-base-content/60">Ketuk untuk memilih berat yang diinginkan</span>
            </div>
          </div>
        </div>

        {/* Floating Save Button */}
        <div className="fixed bottom-20 lg:bottom-10 left-0 right-0 p-4 bg-base-100/80 backdrop-blur-md lg:bg-transparent lg:static lg:p-0 border-t border-base-200 lg:border-none z-10 transition-all">
          <div className="max-w-xl mx-auto">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary w-full btn-lg shadow-lg"
            >
              {saving ? <span className="loading loading-spinner"></span> : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
        
        {/* Spacer for floating button */}
        <div className="h-24 lg:h-0"></div>

      </form>
    </div>
  );
}

