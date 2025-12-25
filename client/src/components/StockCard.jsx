export default function StockCard({ product }) {
  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
      <div className="card-body">
        {/* Title */}
        <h3 className="card-title text-lg">
          {product.title}
        </h3>
        
        {/* Price */}
        {product.price && (
          <p className="text-primary font-bold text-xl">
            {product.price}
          </p>
        )}
        
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="badge badge-success gap-1">
            <span className="w-2 h-2 rounded-full bg-success-content animate-pulse"></span>
            Tersedia
          </span>
        </div>
        
        {/* Buy Button */}
        <div className="card-actions justify-end mt-2">
          <a
            href="https://www.logammulia.com/id/purchase/gold"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-block"
          >
            Beli Sekarang →
          </a>
        </div>
      </div>
    </div>
  );
}
