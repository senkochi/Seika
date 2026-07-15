import { SectionCard } from "../../ui/SectionCard";

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
    <SectionCard className="flex flex-col items-center justify-center">
      <h3 className="font-sans-ui text-base font-semibold text-cream mb-6 w-full text-left">
        Tiến độ cấp độ
      </h3>

      <div className="relative w-40 h-40 mb-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            stroke="#d4a843"
            strokeWidth="12"
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - currentXP / nextXP)}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center font-sans-ui">
          <p className="text-3xl font-semibold text-cream tabular-nums">
            {percent}%
          </p>
          <p className="text-white/45 text-xs uppercase tracking-[0.12em] mt-1">
            Hoàn thành
          </p>
        </div>
      </div>

      <div className="text-center font-sans-ui">
        <p className="text-white/45 text-xs uppercase tracking-[0.12em] mb-1">
          Cấp hiện tại
        </p>
        <p className="text-xl font-semibold text-cream mb-3 tabular-nums">
          Level {level}
        </p>
        <p className="text-xs text-white/55 tabular-nums">
          {currentXP.toLocaleString("vi-VN")} / {nextXP.toLocaleString("vi-VN")}{" "}
          XP
        </p>
      </div>
    </SectionCard>
  );
}

export default LevelProgressCard;