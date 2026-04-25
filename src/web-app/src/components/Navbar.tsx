import { Sparkles, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-purple-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center rotate-12 shadow-lg">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <span className="text-2xl font-black text-purple-700">Seika</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-gray-700 hover:text-purple-600 transition-colors">
              Home
            </a>
            <a href="#about" className="text-gray-700 hover:text-purple-600 transition-colors">
              About
            </a>
            <a href="#features" className="text-gray-700 hover:text-purple-600 transition-colors">
              Features
            </a>
            <a href="#contact" className="text-gray-700 hover:text-purple-600 transition-colors">
              Contact
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button className="px-4 py-2 text-purple-600 hover:text-purple-700 transition-colors">
              Login
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full hover:shadow-lg hover:scale-105 transition-all">
              Register
            </button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-purple-100">
          <div className="px-4 py-4 space-y-3">
            <a href="#home" className="block text-gray-700 hover:text-purple-600">Home</a>
            <a href="#about" className="block text-gray-700 hover:text-purple-600">About</a>
            <a href="#features" className="block text-gray-700 hover:text-purple-600">Features</a>
            <a href="#contact" className="block text-gray-700 hover:text-purple-600">Contact</a>
            <div className="pt-3 border-t border-purple-100 space-y-2">
              <button className="w-full px-4 py-2 text-purple-600 border border-purple-300 rounded-full">
                Login
              </button>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full">
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
