export default function StockCard({ product }) {
  return (
    <div className="bg-gray-800/80 backdrop-blur-md rounded-xl p-5 border border-gray-700 hover:border-gold-500/50 transition-all">
      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-2">
        {product.title}
      </h3>
      
      {/* Price */}
      {product.price && (
        <p className="text-gold-400 font-bold text-xl mb-3">
          {product.price}
        </p>
      )}
      
      {/* Status */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <span className="text-green-400 text-sm">Tersedia</span>
      </div>
      
      {/* Buy Button */}
      <a
        href="https://www.logammulia.com/id/purchase/gold"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-gray-900 font-semibold text-center rounded-lg transition-all"
      >
        Beli Sekarang →
      </a>
    </div>
  );
}
