import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Sparkles, Home, AlertCircle } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-white p-4">
      <div className="max-w-md w-full text-center">
        {/* Biểu tượng lỗi được stylized theo logo Seika */}
        <div className="relative mb-8 flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-3xl flex items-center justify-center rotate-12 shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-bounce">
            <AlertCircle className="w-12 h-12 text-purple-950 -rotate-12" />
          </div>
          {/* Sparkles trang trí xung quanh */}
          <Sparkles className="absolute top-0 right-1/4 w-6 h-6 text-yellow-300 animate-pulse" />
          <Sparkles className="absolute bottom-0 left-1/4 w-4 h-4 text-purple-300 animate-pulse delay-75" />
        </div>

        {/* Nội dung thông báo */}
        <h1 className="text-8xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-b from-yellow-300 to-yellow-500">
          404
        </h1>
        <h2 className="text-2xl font-bold mb-4">Level Not Found!</h2>
        <p className="text-purple-200 mb-8 leading-relaxed">
          Oops! The page <span className="text-yellow-400 font-mono">"{location.pathname}"</span> seems to have vanished into another dimension. 
          Let's get you back to the main adventure!
        </p>

        {/* Nút quay về trang chủ */}
        <Link 
          to="/" 
          className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-950 font-black rounded-2xl transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(234,179,8,0.5)] active:scale-95"
        >
          <Home className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          BACK TO HOME
        </Link>

        {/* Link hỗ trợ nhỏ ở dưới */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-purple-300 text-sm">
            Need help? <Link to="/contact" className="text-yellow-400 hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
