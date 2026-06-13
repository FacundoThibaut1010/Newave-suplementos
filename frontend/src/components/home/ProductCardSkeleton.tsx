const ProductCardSkeleton = ({ darkTheme = false }: { darkTheme?: boolean }) => (
  <div className="animate-pulse">
    <div className={`aspect-[3/4] rounded-sm mb-4 ${darkTheme ? 'bg-white/10' : 'bg-gray-200'}`} />
    <div className={`h-3 rounded w-1/3 mb-3 ${darkTheme ? 'bg-white/10' : 'bg-gray-200'}`} />
    <div className={`h-5 rounded w-4/5 mb-2 ${darkTheme ? 'bg-white/10' : 'bg-gray-200'}`} />
    <div className={`h-4 rounded w-1/2 ${darkTheme ? 'bg-white/10' : 'bg-gray-200'}`} />
  </div>
);

export default ProductCardSkeleton;
