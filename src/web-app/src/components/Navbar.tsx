import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-purple-900/95 backdrop-blur-md border-b border-purple-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center rotate-12 shadow-lg">
              <Sparkles className="w-6 h-6 text-purple-900" />
            </div>
            <span className="text-2xl font-black text-white">Seika</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-purple-200 hover:text-yellow-400 transition-colors">
              Home
            </a>
            <a href="#about" className="text-purple-200 hover:text-yellow-400 transition-colors">
              About
            </a>
            <a href="#features" className="text-purple-200 hover:text-yellow-400 transition-colors">
              Features
            </a>
            <a href="#contact" className="text-purple-200 hover:text-yellow-400 transition-colors">
              Contact
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button className="px-4 py-2 text-white hover:text-yellow-400 transition-colors">Login</button>
            <button className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 rounded-full hover:shadow-lg hover:scale-105 transition-all font-black">
              Register
            </button>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-purple-800 border-t border-purple-700">
          <div className="px-4 py-4 space-y-3">
            <a href="#home" className="block text-purple-200 hover:text-yellow-400">
              Home
            </a>
            <a href="#about" className="block text-purple-200 hover:text-yellow-400">
              About
            </a>
            <a href="#features" className="block text-purple-200 hover:text-yellow-400">
              Features
            </a>
            <a href="#contact" className="block text-purple-200 hover:text-yellow-400">
              Contact
            </a>
            <div className="pt-3 border-t border-purple-700 space-y-2">
              <button className="w-full px-4 py-2 text-white border border-purple-600 rounded-full">Login</button>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 rounded-full font-black">
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
