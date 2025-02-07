const Loading = () => (
    <div className="relative w-10 h-10 mx-auto mt-8">
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gray-700 animate-ldsEllipsis1"></div>
      <div className="absolute top-2 left-6 w-2 h-2 rounded-full bg-gray-700 animate-ldsEllipsis2"></div>
      <div className="absolute top-2 left-10 w-2 h-2 rounded-full bg-gray-700 animate-ldsEllipsis3"></div>
    </div>
  );
  
  export default Loading;