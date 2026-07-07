interface LevelProgressCardProps {
  level: number;
  currentXP: number;
  nextXP: number;
}

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function LevelProgressCard({
  level,
  currentXP,
  nextXP,
}: LevelProgressCardProps) {
  const percent = nextXP > 0 ? Math.round((currentXP / nextXP) * 100) : 0;

  return (
    <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] rounded-2xl p-6 flex flex-col items-center justify-center">
      <h3 className="text-lg font-bold text-[var(--foreground)] mb-6">
        Level Progress
      </h3>

      <div className="relative w-40 h-40 mb-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            stroke="#10111a"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            stroke="#9333ea"
            strokeWidth="12"
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - currentXP / nextXP)}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold text-[var(--foreground)]">
            {percent}%
          </p>
          <p className="text-[var(--muted-foreground)] text-sm">Complete</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[var(--muted-foreground)] text-sm mb-1">
          Current Level
        </p>
        <p className="text-2xl font-bold text-[var(--foreground)] mb-4">
          Level {level}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {currentXP.toLocaleString()} / {nextXP.toLocaleString()} XP
        </p>
      </div>
    </div>
  );
}

export default LevelProgressCard;