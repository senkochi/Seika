interface RoleBadgeProps {
  role: string;
}

function RoleBadge({ role }: RoleBadgeProps) {
  const upper = role.toUpperCase();
  if (upper === "ADMIN") {
    return (
      <span className="inline-flex rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-300">
        {role}
      </span>
    );
  }
  if (upper === "TEACHER") {
    return (
      <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300">
        {role}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300">
      {role}
    </span>
  );
}

export default RoleBadge;