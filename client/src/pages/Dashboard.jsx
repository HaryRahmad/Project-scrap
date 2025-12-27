import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../helpers/api';
import StockCard from '../components/StockCard';

export default function Dashboard() {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function fetchStock() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const { data } = await api.get('/api/stock');
      setStock(data.data);
      setError('');
    } catch (err) {
      // Auth errors handled by interceptor
      setError(err.response?.data?.message || 'Gagal mengambil data stok');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStock();
    const interval = setInterval(fetchStock, 60000);
    return () => clearInterval(interval);
  }, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-base-content/60">Pantau ketersediaan stok emas real-time</p>
        </div>
        
        <button onClick={fetchStock} className="btn btn-outline btn-sm gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Location Info */}
      {stock && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <h3 className="card-title">{stock.location?.name}</h3>
                <p className="text-base-content/60 text-sm">Lokasi monitoring Anda</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-base-content/60 text-sm">Filter berat:</span>
              {stock.filters?.targetWeights?.map((w, i) => (
                <span key={i} className="badge badge-primary badge-outline">
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stock Status */}
      {stock?.stock ? (
        <div className="space-y-4">
          {/* Status Badge */}
          <div className={`badge gap-2 p-4 ${
            stock.stock.hasStock 
              ? 'badge-success' 
              : 'badge-error'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              stock.stock.hasStock ? 'bg-success-content animate-pulse' : 'bg-error-content'
            }`}></span>
            {stock.stock.hasStock ? 'Stok Tersedia' : 'Stok Habis'}
          </div>

          {/* Product Cards */}
          {stock.stock.hasStock && stock.stock.products?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stock.stock.products.map((product, index) => (
                <StockCard key={index} product={product} />
              ))}
            </div>
          ) : (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <span className="text-4xl mb-4">😔</span>
                <p className="text-base-content/60">
                  Tidak ada produk tersedia dengan filter berat yang Anda pilih.
                </p>
              </div>
            </div>
          )}

          {/* Last Updated */}
          <p className="text-base-content/50 text-sm text-center">
            Terakhir diperbarui: {new Date(stock.stock.lastUpdated).toLocaleString('id-ID')}
          </p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <span className="text-4xl mb-4">⏳</span>
            <p className="text-base-content/60">
              {stock?.message || 'Data stok belum tersedia. Checker bot akan segera mengumpulkan data.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
