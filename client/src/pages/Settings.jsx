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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Atur preferensi monitoring stok emas Anda</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500/20 border border-green-500 text-green-400'
            : 'bg-red-500/20 border border-red-500 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700 space-y-6">
        {/* Location */}
        <div>
          <label className="block text-gray-300 font-medium mb-2">
            📍 Lokasi Butik
          </label>
          <select
            value={formData.locationId}
            onChange={handleLocationChange}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
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
        <div>
          <label className="block text-gray-300 font-medium mb-2">
            ⚖️ Filter Berat Emas
          </label>
          <p className="text-gray-500 text-sm mb-3">
            Pilih berat emas yang ingin dipantau
          </p>
          <div className="flex flex-wrap gap-2">
            {WEIGHT_OPTIONS.map(weight => (
              <button
                key={weight}
                type="button"
                onClick={() => handleWeightToggle(weight)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  formData.targetWeights.includes(weight)
                    ? 'bg-gold-500 text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {weight}
              </button>
            ))}
          </div>
        </div>

        {/* Telegram Chat ID */}
        <div>
          <label className="block text-gray-300 font-medium mb-2">
            📱 Telegram Chat ID
          </label>
          <input
            type="text"
            value={formData.telegramChatId}
            onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
            placeholder="123456789"
          />
          <p className="text-gray-500 text-sm mt-1">
            Dapatkan dari @userinfobot di Telegram untuk menerima notifikasi
          </p>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-gray-300 font-medium">Aktifkan Monitoring</label>
            <p className="text-gray-500 text-sm">Terima notifikasi saat stok tersedia</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              formData.isActive ? 'bg-gold-500' : 'bg-gray-600'
            }`}
          >
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
              formData.isActive ? 'left-8' : 'left-1'
            }`}></span>
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-gray-900 font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan Settings'}
        </button>
      </form>
    </div>
  );
}
