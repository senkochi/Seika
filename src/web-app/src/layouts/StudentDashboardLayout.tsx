import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Store,
  Wallet,
  User,
  Bell,
  Search,
  Settings,
  LogOut,
} from "lucide-react";
import GridBackground from "./GridBackground";
import { Logo } from "../components/logo/Logo";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/authSlice";
import {
  clearUserProfile,
  fetchCurrentUserProfile,
} from "../store/userProfileSlice";
import { useNotificationSSE } from "../hooks/useNotificationSSE";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from "../store/notificationSlice";
import { formatDistanceToNow } from "date-fns";

function StudentDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const dispatch = useAppDispatch();
  const { fullName, username, level, profilePictureUrl, status } =
    useAppSelector((state) => state.userProfile);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [dispatch, status]);

  const authUsername = useAppSelector((state) => state.auth.username);
  const displayName = fullName ?? username ?? authUsername ?? "Learner";

  // Use real notifications
  useNotificationSSE();
  const { items: notifications, unreadCount } = useAppSelector(
    (state) => state.notifications,
  );

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearUserProfile());
    navigate("/auth/login");
  };
  const navItems = [
    { id: "home", label: "Dashboard", icon: Home, path: "/student/dashboard" },
    {
      id: "learning",
      label: "Learning Hub",
      icon: BookOpen,
      path: "/student/dashboard/learning",
    },
    {
      id: "marketplace",
      label: "Marketplace",
      icon: Store,
      path: "/student/dashboard/marketplace",
    },
    {
      id: "wallet",
      label: "Wallet",
      icon: Wallet,
      path: "/student/dashboard/wallet",
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      path: "/student/dashboard/profile",
    },
  ];

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        avatarMenuRef.current &&
        !avatarMenuRef.current.contains(event.target as Node)
      ) {
        setAvatarMenuOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAvatarMenuOpen(false);
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative isolate min-h-[100dvh] w-full overflow-hidden bg-[var(--background)]">
      {/*Grid Background*/}
      <GridBackground />

      {/* Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 w-64 bg-[rgba(20,15,38,0.88)] border-r border-[var(--border)] flex flex-col shadow-[0_24px_80px_rgba(10,10,20,0.25)] backdrop-blur-xl">
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
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${active ? "text-[var(--primary-foreground)]" : ""}`}
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
            onClick={() => navigate("/student/dashboard")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)] transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="font-bold text-sm">Settings</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)] transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex min-h-[100dvh] min-w-0 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="relative z-50 bg-[rgba(24,18,45,0.9)] border-b border-[var(--border)] px-8 py-4 shadow-[0_12px_40px_rgba(10,10,20,0.18)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-12 pr-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)] transition-colors"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <div ref={notificationsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="relative p-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  <Bell className="w-5 h-5 text-[var(--muted-foreground)]" />
                  {unreadCount > 0 && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-[var(--primary)] rounded-full"></div>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-80 overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(24,18,45,0.98)] shadow-[0_24px_80px_rgba(10,10,20,0.35)] backdrop-blur-xl">
                    <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                      <h3 className="font-bold text-[var(--foreground)]">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => dispatch(markAllAsRead())}
                          className="text-xs text-[var(--primary)] hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const isUnread = notif.status === "UNREAD";
                          return (
                            <div
                              key={notif.id}
                              onClick={() => {
                                if (isUnread) dispatch(markAsRead(notif.id));
                              }}
                              className={`p-4 border-b border-[var(--border)] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer ${
                                isUnread ? "bg-[rgba(255,255,255,0.02)]" : ""
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h4
                                  className={`text-sm font-bold ${isUnread ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
                                >
                                  {notif.title}
                                </h4>
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-[var(--primary)] mt-1.5 flex-shrink-0"></span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                                {notif.content}
                              </p>
                              <span className="text-[10px] text-[var(--muted-foreground)] mt-2 block">
                                {formatDistanceToNow(
                                  new Date(notif.createdAt),
                                  {
                                    addSuffix: true,
                                  },
                                )}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="p-3 border-t border-[var(--border)] text-center bg-[rgba(255,255,255,0.02)]">
                      <button className="text-sm font-bold text-[var(--primary)] hover:underline">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div
                ref={avatarMenuRef}
                className="relative pl-4 border-l border-[var(--border)]"
              >
                <button
                  type="button"
                  onClick={() => setAvatarMenuOpen((current) => !current)}
                  className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-[var(--border)] overflow-hidden flex items-center justify-center bg-[var(--second-card)]">
                    {profilePictureUrl ? (
                      <img
                        src={profilePictureUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-[var(--foreground)]">
                        {displayName[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[var(--foreground)] text-sm font-bold">
                      {displayName}
                    </p>
                    <p className="text-[var(--muted-foreground)] text-xs">
                      Level {level}
                    </p>
                  </div>
                </button>

                {avatarMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-56 overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(24,18,45,0.98)] shadow-[0_24px_80px_rgba(10,10,20,0.35)] backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        navigate("/student/dashboard/profile");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[var(--foreground)] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                    >
                      <User className="w-4 h-4 text-[var(--primary)]" />
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        navigate("/student/dashboard");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[var(--foreground)] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                    >
                      <Settings className="w-4 h-4 text-[var(--primary)]" />
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[var(--foreground)] transition-colors hover:bg-[rgba(239,68,68,0.14)]"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      Logout
                    </button>
                  </div>
                )}
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
