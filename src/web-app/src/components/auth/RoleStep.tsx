import { GraduationCap, User } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { RegisterData } from "./types";
import { cn } from "../ui/utils";

interface RoleStepProps {
  formData: RegisterData;
  setFormData: Dispatch<SetStateAction<RegisterData>>;
}

export default function RoleStep({ formData, setFormData }: RoleStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="font-display text-2xl text-[#faf6ee] tracking-[-0.015em]">
          How will you be using Seika?
        </h2>
        <p className="mt-2 text-sm text-[#faf6ee]/60">
          Pick one — you can always switch roles later.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RoleCard
          selected={formData.role === "STUDENT"}
          onClick={() => setFormData({ ...formData, role: "STUDENT" })}
          icon={
            <GraduationCap className="w-5 h-5" strokeWidth={1.5} />
          }
          title="Student"
          description="Learn, compete, earn rewards"
        />

        <RoleCard
          selected={formData.role === "TEACHER"}
          onClick={() => setFormData({ ...formData, role: "TEACHER" })}
          icon={<User className="w-5 h-5" strokeWidth={1.5} />}
          title="Teacher"
          description="Build quizzes, track cohorts"
        />
      </div>
    </div>
  );
}

function RoleCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative text-left p-6 rounded-2xl",
        "transition-all duration-500 ease-spring",
        "focus:outline-none",
        selected
          ? "p-px bg-gradient-to-b from-[#d4a843] to-[#a37f2a]"
          : "p-px bg-white/[0.06] hover:bg-white/[0.12]",
      )}
    >
      <div
        className={cn(
          "rounded-[calc(1rem-1px)] p-5",
          "transition-colors duration-500 ease-soft",
          selected
            ? "bg-gradient-to-br from-[#1c0f2e] to-[#15091e] shadow-[inset_0_1px_1px_rgba(212,168,67,0.2)]"
            : "bg-[#1c0f2e]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]",
        )}
      >
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "inline-flex items-center justify-center w-11 h-11 rounded-xl",
              "transition-all duration-500 ease-spring",
              selected
                ? "bg-gradient-to-br from-[#e6c264] to-[#c89a36] text-[#1c0f2e] rotate-[-4deg]"
                : "bg-white/[0.06] text-[#faf6ee]/70 group-hover:text-[#faf6ee]",
            )}
          >
            {icon}
          </span>
          <div className="flex-1">
            <p
              className={cn(
                "font-display text-xl",
                selected ? "text-[#faf6ee]" : "text-[#faf6ee]/80",
              )}
            >
              {title}
            </p>
            <p className="mt-1 text-sm text-[#faf6ee]/55">{description}</p>
          </div>
          <span
            aria-hidden
            className={cn(
              "w-5 h-5 rounded-full border transition-all duration-500 ease-spring",
              selected
                ? "bg-[#d4a843] border-[#d4a843] scale-100"
                : "border-white/[0.18] scale-90",
            )}
          >
            {selected && (
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="w-full h-full p-0.5 text-[#1c0f2e]"
              >
                <path
                  d="M3 8.5l3 3 7-7"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </div>
      </div>
    </button>
  );
}