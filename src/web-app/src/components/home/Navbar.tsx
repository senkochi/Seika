import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../logo/Logo";
import { useAppSelector } from "../../store/hooks";
import { cn } from "../ui/utils";
import { Button } from "../ui/Button";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { accessToken, roles } = useAppSelector((state) => state.auth);
  const isTeacher =
    roles?.some(
      (role) =>
        role.toUpperCase() === "ROLE_TEACHER" ||
        role.toUpperCase() === "TEACHER",
    ) ?? false;
  const dashboardPath = isTeacher ? "/teacher/dashboard" : "/student/dashboard";

  return (
    <>
      {/* Floating glass pill */}
      <nav className="fixed top-0 inset-x-0 z-50 pointer-events-none">
        <div className="w-full max-w-[1100px] mx-auto mt-5 px-4 sm:px-6 pointer-events-auto">
          <div
            className={cn(
              "flex items-center justify-between h-14 pl-5 pr-2 rounded-full",
              "bg-[var(--color-header)]/70 backdrop-blur-2xl",
              "border border-white/[0.08]",
              "shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_32px_-12px_rgba(0,0,0,0.5)]",
            )}
          >
            <Logo
              imageClassName="w-8 h-8"
              textClassName="text-lg font-display font-medium tracking-tight text-[#faf6ee]"
            />

            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium text-[#faf6ee]/75 rounded-full",
                    "hover:text-[#faf6ee] hover:bg-white/[0.04]",
                    "transition-colors duration-300 ease-soft",
                  )}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-2">
              {accessToken ? (
                <Button
                  variant="primary"
                  size="md"
                  trailing
                  onClick={() => navigate(dashboardPath)}
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/auth/login")}
                    className="px-4 h-10 text-sm font-medium text-[#faf6ee]/75 hover:text-[#faf6ee] transition-colors duration-300 ease-soft rounded-full"
                  >
                    Sign in
                  </button>
                  <Button
                    variant="primary"
                    size="md"
                    trailing
                    onClick={() => navigate("/auth/register")}
                  >
                    Get started
                  </Button>
                </>
              )}
            </div>

            {/* Hamburger morphs to X */}
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="md:hidden relative w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center"
            >
              <span
                className={cn(
                  "absolute h-px w-4 bg-[#faf6ee] transition-all duration-500 ease-spring",
                  open ? "rotate-45" : "-translate-y-1",
                )}
              />
              <span
                className={cn(
                  "absolute h-px w-4 bg-[#faf6ee] transition-all duration-500 ease-spring",
                  open ? "-rotate-45" : "translate-y-1",
                )}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile full-screen overlay */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-40 transition-all duration-500 ease-spring",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      >
        <div className="absolute inset-0 bg-[var(--color-header)]/92 backdrop-blur-3xl" />
        <div className="relative h-full flex flex-col items-center justify-center gap-10 px-6 pt-24">
          <div className="flex flex-col items-center gap-6">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "font-display text-4xl font-medium text-[#faf6ee] hover:text-[#d4a843]",
                  "transition-all duration-700 ease-soft",
                  open
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12",
                )}
                style={{ transitionDelay: open ? `${120 + i * 80}ms` : "0ms" }}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div
            className={cn(
              "flex flex-col items-center gap-3 mt-12 w-full max-w-xs",
              "transition-all duration-700 ease-soft",
              open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            )}
            style={{ transitionDelay: open ? "520ms" : "0ms" }}
          >
            {accessToken ? (
              <Button
                variant="primary"
                size="lg"
                trailing
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  navigate(dashboardPath);
                }}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate("/auth/login");
                  }}
                  className="w-full h-12 rounded-full border border-white/[0.12] text-[#faf6ee] font-medium hover:bg-white/[0.04] transition-colors"
                >
                  Sign in
                </button>
                <Button
                  variant="primary"
                  size="lg"
                  trailing
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    navigate("/auth/register");
                  }}
                >
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
