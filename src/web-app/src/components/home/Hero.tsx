import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import GameJoystick from "../3d-objects/GameJoystick";
import YellowBlueSchoolBag from "../3d-objects/YellowBlueSchoolBag";
import { Button } from "../ui/Button";
import { cn } from "../ui/utils";

export function Hero() {
  const navigate = useNavigate();
  const { accessToken, roles } = useAppSelector((state) => state.auth);
  const isTeacher =
    roles?.some(
      (role) =>
        role.toUpperCase() === "ROLE_TEACHER" ||
        role.toUpperCase() === "TEACHER",
    ) ?? false;
  const dashboardPath = isTeacher ? "/teacher/dashboard" : "/student/dashboard";

  return (
    <section
      id="home"
      className="relative min-h-[100dvh] flex items-end pb-16 lg:pb-24 pt-32 overflow-hidden"
    >
      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-glow-aubergine pointer-events-none" />

      {/* Hairline at section top — replaces wavy divider */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 hairline max-w-[120px]" />

      <div className="relative w-full max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-16 lg:gap-20 items-center">
          {/* LEFT — editorial type */}
          <div className="space-y-10">
            <div className="animate-fade-up">
              <span className="eyebrow">
                <span className="inline-block w-1 h-1 rounded-full bg-[#d4a843]" />
                Now in beta · Hà Nội
              </span>
            </div>

            <h1
              className={cn(
                "font-display font-medium text-[#faf6ee]",
                "text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem]",
                "leading-[0.95] tracking-[-0.035em]",
                "animate-fade-up delay-100",
              )}
              style={{ textWrap: "balance" as const }}
            >
              Learn by playing.{" "}
              <span className="italic font-display font-light text-[#d4a843]">
                Master
              </span>{" "}
              by doing.
            </h1>

            <p className="max-w-xl text-lg text-[#faf6ee]/70 leading-relaxed animate-fade-up delay-200">
              Seika turns study material into something you actually want to
              open. Quizzes, flashcards, and a coin economy that pays you
              back for paying attention.
            </p>

            <div className="flex flex-wrap items-center gap-3 animate-fade-up delay-300">
              <Button
                variant="primary"
                size="lg"
                trailing
                onClick={() =>
                  navigate(accessToken ? dashboardPath : "/auth/register")
                }
              >
                {accessToken ? "Open dashboard" : "Start learning"}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  const el = document.getElementById("features");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                See what's inside
              </Button>
            </div>

            {/* Stats — tabular, real-feel numbers */}
            <dl className="grid grid-cols-3 gap-6 pt-10 border-t border-white/[0.06] animate-fade-up delay-400">
              {[
                { value: "2,847", label: "Active learners" },
                { value: "134", label: "Verified educators" },
                { value: "47.2%", label: "Completion rate" },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <dt className="font-display text-3xl lg:text-4xl text-[#faf6ee] font-tabular">
                    {stat.value}
                  </dt>
                  <dd className="text-[11px] uppercase tracking-[0.16em] text-[#b8a9d9]">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* RIGHT — Z-axis cascade of transparent PNGs */}
          <div className="relative h-[520px] lg:h-[600px] hidden md:block animate-fade-up delay-300">
            {/* Back layer — joystick, raw transparent PNG */}
            <div
              className="absolute top-3/4 left-8/9 -translate-x-1/2 -translate-y-1/2 z-10 -ml-16 -mt-12"
              style={{ animation: "float-slow 7s ease-in-out infinite" }}
            >
              <GameJoystick width={320} />
            </div>

            {/* Front layer — school bag, raw transparent PNG, slightly offset and tilted */}
            <div
              className="absolute bottom-1/4 right-1/10 -translate-x-1/2 -translate-y-1/2 translate-x-12 translate-y-10 rotate-[5deg]"
              style={{ animation: "float-slow-reverse 5.2s ease-in-out infinite" }}
            >
              <YellowBlueSchoolBag width={520} />
            </div>

            {/* Floating "+50 XP" chip */}
            <div
              className="absolute top-8 -left-4 lg:-left-12 rotate-[-6deg] animate-fade-up delay-500"
            >
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#15091e]/80 backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_32px_-12px_rgba(0,0,0,0.6)]">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e6c264] to-[#c89a36] flex items-center justify-center text-[#1c0f2e] font-bold text-sm">
                  +
                </span>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8a9d9]">
                    Earned today
                  </p>
                  <p className="font-display text-xl text-[#faf6ee] font-tabular">
                    50 <span className="text-sm text-[#d4a843]">XP</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}