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
    setLoading(true);
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

  if (loading && !stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="loading loading-bars loading-lg text-primary"></span>
        <p className="text-base-content/50 animate-pulse">Mengambil data terbaru...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Hero / Status Section */}
      {stock && (
        <div className="stats shadow w-full stats-vertical lg:stats-horizontal bg-base-100">
          <div className="stat">
            <div className="stat-figure text-primary">
              <span className="text-3xl">📍</span>
            </div>
            <div className="stat-title">Lokasi</div>
            <div className="stat-value text-primary text-2xl">{stock.location?.name}</div>
            <div className="stat-desc">Monitoring aktif</div>
          </div>
          
          <div className="stat">
            <div className={`stat-figure ${stock.stock?.hasStock ? 'text-success' : 'text-error'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div className="stat-title">Status Stok</div>
            <div className={`stat-value text-3xl ${stock.stock?.hasStock ? 'text-success' : 'text-error'}`}>
              {stock.stock?.hasStock ? 'Tersedia' : 'Habis'}
            </div>
            <div className="stat-desc">
              Updated: {stock.stock?.lastUpdated ? new Date(stock.stock.lastUpdated).toLocaleTimeString('id-ID') : '-'}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Filter Chips - Horizontal Scroll */}
      {stock?.filters?.targetWeights?.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-xs font-bold text-base-content/50 uppercase whitespace-nowrap">Filter:</span>
          {stock.filters.targetWeights.map((w, i) => (
            <div key={i} className="badge badge-primary badge-outline whitespace-nowrap p-3">
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Content Area */}
      {stock?.stock ? (
        stock.stock.hasStock && stock.stock.products?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stock.stock.products.map((product, index) => (
              <StockCard key={index} product={product} />
            ))}
          </div>
        ) : (
          <div className="hero bg-base-200 rounded-box py-10">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <span className="text-6xl mb-4 block">😴</span>
                <h1 className="text-2xl font-bold">Stok Belum Tersedia</h1>
                <p className="py-6 text-base-content/70">
                  Saat ini belum ada stok emas yang sesuai dengan filter Anda di {stock.location?.name}.
                  Bot akan terus memantau untuk Anda.
                </p>
                <button onClick={fetchStock} className="btn btn-primary">Cek Lagi Sekarang</button>
              </div>
            </div>
          </div>
        )
      ) : (
        !loading && (
          <div className="alert">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Data belum tersedia. Bot sedang bekerja di latar belakang.</span>
          </div>
        )
      )}

      {/* Floating Refresh Button (Mobile only) */}
      <div className="fixed bottom-24 right-4 z-30 lg:hidden">
        <button 
          onClick={fetchStock} 
          className={`btn btn-circle btn-primary btn-lg shadow-lg ${loading ? 'btn-disabled' : ''}`}
        >
          {loading ? (
             <span className="loading loading-spinner"></span>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}
