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

      const { data } = await api.get('/api/stock', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStock(data.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      setError(err.response?.data?.message || 'Gagal mengambil data stok');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStock();
    
    // Auto refresh every 60 seconds
    const interval = setInterval(fetchStock, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Pantau ketersediaan stok emas real-time</p>
        </div>
        
        <button
          onClick={fetchStock}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Location Info */}
      {stock && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📍</span>
            <div>
              <h3 className="text-lg font-semibold text-white">{stock.location?.name}</h3>
              <p className="text-gray-400 text-sm">Lokasi monitoring Anda</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="text-gray-400 text-sm">Filter berat:</span>
            {stock.filters?.targetWeights?.map((w, i) => (
              <span key={i} className="px-2 py-1 bg-gold-500/20 text-gold-400 text-xs rounded-full">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stock Status */}
      {stock?.stock ? (
        <div className="space-y-4">
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            stock.stock.hasStock 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            <span className={`w-3 h-3 rounded-full ${
              stock.stock.hasStock ? 'bg-green-500 animate-pulse' : 'bg-red-500'
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
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-8 border border-gray-700 text-center">
              <span className="text-4xl mb-4 block">😔</span>
              <p className="text-gray-400">
                Tidak ada produk tersedia dengan filter berat yang Anda pilih.
              </p>
            </div>
          )}

          {/* Last Updated */}
          <p className="text-gray-500 text-sm text-center">
            Terakhir diperbarui: {new Date(stock.stock.lastUpdated).toLocaleString('id-ID')}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-8 border border-gray-700 text-center">
          <span className="text-4xl mb-4 block">⏳</span>
          <p className="text-gray-400">
            {stock?.message || 'Data stok belum tersedia. Checker bot akan segera mengumpulkan data.'}
          </p>
        </div>
      )}
    </div>
  );
}
