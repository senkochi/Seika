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
 * SectionCard — solid container for dashboard sections. Has hairline border and backdrop-blur-xl to make cards solid like FlashcardSetCard.
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
        "rounded-2xl border border-[var(--border)] p-6",
        "bg-[var(--card)] backdrop-blur-xl",
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
