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
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[var(--card)] border-r border-[var(--border)] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--border)]">
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
                    ? "bg-[var(--primary)] text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${active ? "text-[var(--foreground)]" : ""}`}
                />
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[var(--border)] space-y-2">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)] transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="font-bold text-sm">Settings</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)] transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-[var(--card)] border-b border-[var(--border)] px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-12 pr-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)] transition-colors"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <button className="relative p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:bg-[var(--second-muted)] transition-colors">
                <Bell className="w-5 h-5 text-[var(--muted-foreground)]" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-[var(--primary)] rounded-full"></div>
              </button>

              {/* User Avatar */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
                <div className="w-10 h-10 rounded-full border-2 border-[var(--border)] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-[var(--foreground)] text-sm font-bold">
                    Alex
                  </p>
                  <p className="text-[var(--muted-foreground)] text-xs">
                    Level 12
                  </p>
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
