import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./logo/Logo";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-indigo-950/95 backdrop-blur-md border-b border-violet-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo imageClassName="w-10 h-10" />

          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-violet-200 hover:text-amber-400 transition-colors">
              Home
            </a>
            <a href="#about" className="text-violet-200 hover:text-amber-400 transition-colors">
              About
            </a>
            <a href="#features" className="text-violet-200 hover:text-amber-400 transition-colors">
              Features
            </a>
            <a href="#contact" className="text-violet-200 hover:text-amber-400 transition-colors">
              Contact
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button className="px-4 py-2 text-white hover:text-amber-400 transition-colors">Login</button>
            <button className="px-6 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 rounded-full hover:shadow-lg hover:scale-105 transition-all font-black">
              Register
            </button>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-violet-900 border-t border-violet-800">
          <div className="px-4 py-4 space-y-3">
            <a href="#home" className="block text-violet-200 hover:text-amber-400">
              Home
            </a>
            <a href="#about" className="block text-violet-200 hover:text-amber-400">
              About
            </a>
            <a href="#features" className="block text-violet-200 hover:text-amber-400">
              Features
            </a>
            <a href="#contact" className="block text-violet-200 hover:text-amber-400">
              Contact
            </a>
            <div className="pt-3 border-t border-violet-800 space-y-2">
              <button className="w-full px-4 py-2 text-white border border-violet-700 rounded-full">Login</button>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 rounded-full font-black">
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
