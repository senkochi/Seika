import type { ReactNode } from "react";
import { cn } from "./utils";

type Crumb = { label: string; to?: string };

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
  className?: string;
};

/**
 * PageHeader — single source of truth for the title row at the top of every
 * dashboard page. Absorbs the duplicated "Làm mới" buttons. Always renders
 * Outfit (no Fraunces) via `font-sans-ui` so the global display-font rule
 * cannot leak into the workspace.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className = "",
}: Props) {
  return (
    <header className={cn("flex flex-col gap-3 pb-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-white/40 font-sans-ui"
        >
          {breadcrumbs.map((c, i) => (
            <span key={`${c.label}-${i}`}>
              {c.to ? (
                <a href={c.to} className="hover:text-white/70 transition-colors">
                  {c.label}
                </a>
              ) : (
                c.label
              )}
              {i < breadcrumbs.length - 1 && (
                <span className="mx-2 text-white/20">/</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <h1 className="font-sans-ui text-2xl font-semibold tracking-tight text-cream">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-white/55 font-sans-ui">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}