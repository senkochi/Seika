import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
  backHref?: string;
  /** Max-width of the form card in px. Defaults to 520. */
  maxWidth?: number;
}

/**
 * Single-pane auth shell: just the form card on the aubergine background.
 * (Previously also rendered a cream brand panel — removed for simplicity.)
 */
export function AuthShell({
  children,
  backHref = "/",
  maxWidth = 520,
}: AuthShellProps) {
  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden py-10 px-4 sm:px-6">
      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-glow-aubergine pointer-events-none" />

      <Link
        to={backHref}
        className="fixed top-6 left-6 z-50 inline-flex items-center gap-2 text-sm text-[#faf6ee]/60 hover:text-[#faf6ee] transition-colors duration-300 ease-soft"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        <span className="hidden sm:inline">Back home</span>
      </Link>

      <div className="relative w-full" style={{ maxWidth: `${maxWidth}px` }}>
        <div className="p-1 rounded-[2rem] bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.08]">
          <div className="rounded-[calc(2rem-0.375rem)] bg-[#15091e]/85 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_32px_80px_-24px_rgba(0,0,0,0.6)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}