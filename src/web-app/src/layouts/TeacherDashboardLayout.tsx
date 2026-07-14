import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Wallet,
  User,
  Bell,
  Search,
  Settings,
  LogOut,
  GraduationCap,
  BarChart3,
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
import TeacherTierBadge from "../components/teacher/TeacherTierBadge";
import { useTeacherRating } from "../components/teacher/useTeacherRating";
import { StatusPill } from "../components/ui/StatusPill";

function TeacherDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const dispatch = useAppDispatch();
  const { fullName, username, profilePictureUrl, status, userId } =
    useAppSelector((state) => state.userProfile);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [dispatch, status]);

  // Use real notifications
  useNotificationSSE();
  const { items: notifications, unreadCount } = useAppSelector(
    (state) => state.notifications,
  );

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const authUsername = useAppSelector((state) => state.auth.username);
  const roles = useAppSelector((state) => state.auth.roles);

  const displayName = fullName ?? username ?? authUsername ?? "Teacher";
  const { rating: teacherRating } = useTeacherRating(userId);

  // Kiểm tra quyền Teacher
  useEffect(() => {
    const isTeacher = roles.some(
      (role) =>
        role.toUpperCase() === "ROLE_TEACHER" ||
        role.toUpperCase() === "TEACHER",
    );
    if (roles.length > 0 && !isTeacher) {
      navigate("/student/dashboard", { replace: true });
    }
  }, [roles, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearUserProfile());
    navigate("/auth/login");
  };
  const navItems = [
    { id: "home", label: "Dashboard", icon: Home, path: "/teacher/dashboard" },
    {
      id: "content",
      label: "Content Manager",
      icon: BookOpen,
      path: "/teacher/dashboard/content",
    },
    {
      id: "wallet",
      label: "Wallet",
      icon: Wallet,
      path: "/teacher/dashboard/wallet",
    },
    {
      id: "statistics",
      label: "Statistics",
      icon: BarChart3,
      path: "/teacher/dashboard/statistics",
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      path: "/teacher/dashboard/profile",
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
      {/* Grid Background */}
      <GridBackground />

      {/* Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 w-60 bg-[#1c0f2e] border-r border-white/[0.06] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Logo />
            <StatusPill variant="gold">Teacher</StatusPill>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                aria-current={active ? "page" : undefined}
                className={`w-full flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-md transition-colors font-sans-ui text-sm ${
                  active
                    ? "bg-white/[0.05] text-cream border-l-2 border-[#d4a843]"
                    : "text-white/55 border-l-2 border-transparent hover:bg-white/[0.03] hover:text-cream"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${active ? "text-[#d4a843]" : ""}`}
                  aria-hidden="true"
                />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/[0.06] space-y-1">
          <button
            type="button"
            onClick={() => navigate("/teacher/dashboard")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-white/55 hover:bg-white/[0.03] hover:text-cream transition-colors font-sans-ui text-sm"
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
            <span className="font-medium">Settings</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-white/55 hover:bg-white/[0.03] hover:text-cream transition-colors font-sans-ui text-sm"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-60 flex min-h-[100dvh] min-w-0 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="relative z-50 bg-[#15091e]/80 backdrop-blur-md border-b border-white/[0.06] px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search materials, quizzes..."
                  className="w-full pl-11 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-cream placeholder-white/40 focus:outline-none focus:border-[#d4a843]/50 transition-colors font-sans-ui text-sm"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <div ref={notificationsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  aria-label="Notifications"
                  className="relative p-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition-colors"
                >
                  <Bell className="w-4 h-4 text-white/60" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#d4a843] rounded-full" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-80 overflow-hidden rounded-xl border border-white/[0.08] bg-[#1c0f2e] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                    <div className="p-4 border-b border-white/[0.06] flex justify-between items-center">
                      <h3 className="font-sans-ui font-semibold text-cream text-sm">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => dispatch(markAllAsRead())}
                          className="text-xs text-[#d4a843] hover:underline font-sans-ui"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-white/50 font-sans-ui">
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
                              className={`p-4 border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors cursor-pointer ${
                                isUnread ? "bg-white/[0.02]" : ""
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1 gap-2">
                                <h4
                                  className={`font-sans-ui text-sm font-medium ${
                                    isUnread ? "text-cream" : "text-white/55"
                                  }`}
                                >
                                  {notif.title}
                                </h4>
                                {isUnread && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4a843] mt-2 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-white/50 line-clamp-2 font-sans-ui">
                                {notif.content}
                              </p>
                              <span className="text-[10px] text-white/40 mt-2 block font-sans-ui">
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
                    <div className="p-3 border-t border-white/[0.06] text-center">
                      <button className="text-xs font-sans-ui font-medium text-[#d4a843] hover:underline">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div
                ref={avatarMenuRef}
                className="relative pl-4 border-l border-white/[0.06]"
              >
                <button
                  type="button"
                  onClick={() => setAvatarMenuOpen((current) => !current)}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="w-9 h-9 rounded-full border border-white/[0.08] overflow-hidden flex items-center justify-center bg-white/[0.06]">
                    {profilePictureUrl ? (
                      <img
                        src={profilePictureUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-sans-ui font-medium text-cream">
                        {displayName[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-cream text-sm font-sans-ui font-medium flex items-center gap-1.5">
                      {displayName}
                      <GraduationCap className="w-3.5 h-3.5 text-[#d4a843]" />
                    </p>
                    <div className="mt-1">
                      <TeacherTierBadge rating={teacherRating} compact />
                    </div>
                  </div>
                </button>

                {avatarMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-[#1c0f2e] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        navigate("/teacher/dashboard/profile");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-sans-ui text-cream hover:bg-white/[0.05] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        navigate("/teacher/dashboard");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-sans-ui text-cream hover:bg-white/[0.05] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-sans-ui text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
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

export default TeacherDashboardLayout;
