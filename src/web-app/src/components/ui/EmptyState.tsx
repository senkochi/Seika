import type { ReactNode } from "react";
import { IconChip } from "./IconChip";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

/**
 * EmptyState — used wherever a dashboard section has nothing to show yet.
 * Quiet hairline frame; never centered in a giant gradient orb.
 */
export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {icon && (
        <div className="mb-4">
          <IconChip variant="muted">{icon}</IconChip>
        </div>
      )}
      <p className="font-sans-ui text-sm font-medium text-cream">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-white/50 font-sans-ui">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}