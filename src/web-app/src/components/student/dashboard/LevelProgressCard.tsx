import { SectionCard } from "../../ui/SectionCard";

interface LevelProgressCardProps {
  level: number;
  currentXP: number;
  nextXP: number;
}

function LevelProgressCard({ level, currentXP, nextXP }: LevelProgressCardProps) {
  const percent = nextXP > 0 ? Math.round((currentXP / nextXP) * 100) : 0;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  return (
    <SectionCard className="flex flex-col items-center justify-center">
      <h3 className="font-sans-ui text-base font-semibold text-cream mb-6">
        Tiến trình level
      </h3>

      <div className="relative w-40 h-40 mb-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#d4a843"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - currentXP / nextXP)}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-sans-ui text-4xl font-semibold text-cream tabular-nums">
            {percent}%
          </p>
          <p className="font-sans-ui text-xs text-white/45 uppercase tracking-[0.12em]">
            Hoàn thành
          </p>
        </div>
      </div>

      <div className="text-center">
        <p className="font-sans-ui text-xs uppercase tracking-[0.12em] text-white/45 mb-1">
          Level hiện tại
        </p>
        <p className="font-sans-ui text-2xl font-semibold text-cream mb-3 tabular-nums">
          Level {level}
        </p>
        <p className="font-sans-ui text-xs text-white/55 tabular-nums">
          {currentXP.toLocaleString()} / {nextXP.toLocaleString()} XP
        </p>
      </div>
    </SectionCard>
  );
}

export default LevelProgressCard;