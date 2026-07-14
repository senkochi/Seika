import { type Dispatch, type SetStateAction } from "react";
import { RegisterData } from "./types";
import { TextInput } from "../ui/Input";
import { cn } from "../ui/utils";

interface PersonalStepProps {
  formData: RegisterData;
  setFormData: Dispatch<SetStateAction<RegisterData>>;
  errors?: {
    fullname?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  setErrors?: (errors: any) => void;
}

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export default function PersonalStep({
  formData,
  setFormData,
  errors = {},
  setErrors = () => {},
}: PersonalStepProps) {
  const clearError = (field: keyof typeof errors) => {
    setErrors({ [field]: undefined });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="font-display text-2xl text-[#faf6ee] tracking-[-0.015em]">
          A little about you
        </h2>
        <p className="mt-2 text-sm text-[#faf6ee]/60">
          We'll use this to set up your profile.
        </p>
      </div>

      <div className="space-y-5">
        <TextInput
          label="Full name"
          value={formData.fullname}
          onChange={(e) =>
            setFormData({ ...formData, fullname: e.target.value })
          }
          placeholder="Nguyễn Văn A"
          error={errors.fullname}
          onClearError={() => clearError("fullname")}
          autoComplete="name"
        />

        <TextInput
          label="Date of birth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) =>
            setFormData({ ...formData, dateOfBirth: e.target.value })
          }
          error={errors.dateOfBirth}
          onClearError={() => clearError("dateOfBirth")}
        />

        <div>
          <label className="block mb-2 text-[11px] uppercase tracking-[0.18em] font-medium text-[#d4a843]/80">
            Gender
          </label>
          <div className="grid grid-cols-3 gap-3">
            {GENDERS.map((g) => {
              const selected = formData.gender === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, gender: g.value });
                    if (errors.gender) clearError("gender");
                  }}
                  className={cn(
                    "h-12 rounded-xl text-sm font-medium",
                    "transition-all duration-500 ease-spring",
                    "focus:outline-none",
                    selected
                      ? "p-px bg-gradient-to-b from-[#d4a843] to-[#a37f2a]"
                      : errors.gender
                        ? "p-px bg-gradient-to-b from-[#ef4444] to-[#b91c1c]"
                        : "p-px bg-white/[0.06] hover:bg-white/[0.12]",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center h-full w-full rounded-[calc(0.75rem-1px)]",
                      selected
                        ? "bg-[#1c0f2e] text-[#d4a843]"
                        : "bg-[#1c0f2e]/40 text-[#faf6ee]/70 hover:text-[#faf6ee]",
                    )}
                  >
                    {g.label}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.gender && (
            <p className="mt-2 text-xs text-[#fca5a5] font-medium">
              {errors.gender}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}