interface UserStatusPillProps {
  enabled: boolean;
}

function UserStatusPill({ enabled }: UserStatusPillProps) {
  if (enabled) {
    return (
      <span className="inline-flex rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-300">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-rose-500/20 px-2 py-1 text-xs font-medium text-rose-300">
      Locked
    </span>
  );
}

export default UserStatusPill;