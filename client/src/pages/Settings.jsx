import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../helpers/api';

const WEIGHT_OPTIONS = [
  '0.5 gr', '1 gr', '2 gr', '3 gr', '5 gr', 
  '10 gr', '25 gr', '50 gr', '100 gr', '250 gr', '500 gr', '1000 gr'
];

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    locationId: '',
    locationName: '',
    targetWeights: [],
    telegramChatId: '',
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

      const headers = { Authorization: `Bearer ${token}` };

      const [settingsRes, locationsRes] = await Promise.all([
        api.get('/api/settings', { headers }).catch(() => ({ data: { data: null } })),
        api.get('/api/locations')
      ]);

      setLocations(locationsRes.data.data || []);
      
      if (settingsRes.data.data) {
        const s = settingsRes.data.data;
        setSettings(s);
        setFormData({
          locationId: s.locationId || '',
          locationName: s.locationName || '',
          targetWeights: s.targetWeights || [],
          telegramChatId: '',
          isActive: s.isActive ?? true
        });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function handleLocationChange(e) {
    const locationId = e.target.value;
    const location = locations.find(l => l.locationId === locationId);
    setFormData({
      ...formData,
      locationId,
      locationName: location?.name || ''
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
      const token = localStorage.getItem('access_token');
      await api.put('/api/settings', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Settings berhasil disimpan!' });
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-base-content/60">Atur preferensi monitoring stok emas Anda</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-6">
          {/* Location */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">📍 Lokasi Butik</span>
            </label>
            <select
              value={formData.locationId}
              onChange={handleLocationChange}
              className="select select-bordered w-full"
            >
              <option value="">Pilih lokasi...</option>
              {locations.map(loc => (
                <option key={loc.locationId} value={loc.locationId}>
                  {loc.name} - {loc.city}
                </option>
              ))}
            </select>
          </div>

          {/* Weight Filter */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">⚖️ Filter Berat Emas</span>
            </label>
            <p className="text-base-content/60 text-sm mb-3">
              Pilih berat emas yang ingin dipantau
            </p>
            <div className="flex flex-wrap gap-2">
              {WEIGHT_OPTIONS.map(weight => (
                <button
                  key={weight}
                  type="button"
                  onClick={() => handleWeightToggle(weight)}
                  className={`btn btn-sm ${
                    formData.targetWeights.includes(weight)
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                >
                  {weight}
                </button>
              ))}
            </div>
          </div>

          {/* Telegram Chat ID */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">📱 Telegram Chat ID</span>
            </label>
            <input
              type="text"
              value={formData.telegramChatId}
              onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
              className="input input-bordered w-full"
              placeholder="123456789"
            />
            <label className="label">
              <span className="label-text-alt">Dapatkan dari @userinfobot di Telegram untuk menerima notifikasi</span>
            </label>
          </div>

          {/* Active Toggle */}
          <div className="form-control">
            <label className="label cursor-pointer">
              <div>
                <span className="label-text font-medium">Aktifkan Monitoring</span>
                <p className="text-base-content/60 text-sm">Terima notifikasi saat stok tersedia</p>
              </div>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className="toggle toggle-primary"
              />
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary w-full"
          >
            {saving ? <span className="loading loading-spinner"></span> : 'Simpan Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
