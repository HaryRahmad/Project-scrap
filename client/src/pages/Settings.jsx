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
              {boutiques.map(boutique => (
                <option key={boutique.locationId} value={boutique.locationId}>
                  {boutique.name} - {boutique.city}
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
              {weightOptions.map(w => (
                <button
                  key={w.weightLabel}
                  type="button"
                  onClick={() => handleWeightToggle(w.weightLabel)}
                  className={`btn btn-sm ${
                    formData.targetWeights.includes(w.weightLabel)
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                >
                  {w.weightLabel}
                </button>
              ))}
            </div>
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

