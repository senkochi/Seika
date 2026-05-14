import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Store,
  Wallet,
  Bell,
  Search,
  Settings,
  LogOut,
} from "lucide-react";
import { Logo } from "../components/logo/Logo";

function StudentDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: "home", label: "Dashboard", icon: Home, path: "/dashboard" },
    {
      id: "learning",
      label: "Learning Hub",
      icon: BookOpen,
      path: "/dashboard/learning",
    },
    {
      id: "marketplace",
      label: "Marketplace",
      icon: Store,
      path: "/dashboard/marketplace",
    },
    { id: "wallet", label: "Wallet", icon: Wallet, path: "/dashboard/wallet" },
  ];

  return (
    <div className="flex min-h-screen bg-[#05060f]">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#05060f] border-r border-[#181922] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#181922]">
          <div className="flex items-center gap-3">
            <Logo />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-amber-400" : ""}`} />
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#181922] space-y-2">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800/50 hover:text-white transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="font-bold text-sm">Settings</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800/50 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-[#05060f] border-b border-[#181922] px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-12 pr-4 py-3 bg-[#0a0b14] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 transition-colors"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <button className="relative p-3 bg-[#0a0b14] rounded-xl hover:bg-[#10111a] transition-colors">
                <Bell className="w-5 h-5 text-gray-400" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-purple-600 rounded-full"></div>
              </button>

              {/* User Avatar */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
                <div className="w-10 h-10 rounded-full border-2 border-purple-600 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Alex</p>
                  <p className="text-gray-500 text-xs">Level 12</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentDashboardLayout;
