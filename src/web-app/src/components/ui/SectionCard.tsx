import type { ReactNode, ElementType } from "react";
import { cn } from "./utils";

type Props = {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  as?: ElementType;
};

/**
 * SectionCard — quiet container for dashboard sections. Hairline border, no
 * shadow, no backdrop-blur. Replaces every `backdrop-blur-xl +
 * shadow-[0_24px_80px_*]` panel that the dashboards currently use.
 */
export function SectionCard({
  children,
  className = "",
  header,
  footer,
  as: Tag = "section",
}: Props) {
  return (
    <Tag
      className={cn(
        "rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6",
        className,
      )}
    >
      {header && (
        <div className="mb-5 flex items-center justify-between gap-4">
          {header}
        </div>
      )}
      {children}
      {footer && (
        <div className="mt-5 pt-5 border-t border-white/[0.06]">{footer}</div>
      )}
    </Tag>
  );
}