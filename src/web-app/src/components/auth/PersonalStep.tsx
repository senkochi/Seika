import { type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
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

export default function PersonalStep({
  formData,
  setFormData,
  errors = {},
  setErrors = () => {},
}: PersonalStepProps) {
  const { t } = useTranslation("auth");
  const clearError = (field: keyof typeof errors) => {
    setErrors({ [field]: undefined });
  };

  const genders = [
    { value: "male", label: t("personalStep.genderOptions.male") },
    { value: "female", label: t("personalStep.genderOptions.female") },
    { value: "other", label: t("personalStep.genderOptions.other") },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="font-display text-2xl text-[#faf6ee] tracking-[-0.015em]">
          {t("personalStep.title")}
        </h2>
        <p className="mt-2 text-sm text-[#faf6ee]/60">
          {t("personalStep.subtitle")}
        </p>
      </div>

      <div className="space-y-5">
        <TextInput
          label={t("personalStep.fullnameLabel")}
          value={formData.fullname}
          onChange={(e) =>
            setFormData({ ...formData, fullname: e.target.value })
          }
          placeholder={t("personalStep.fullnamePlaceholder")}
          error={errors.fullname}
          onClearError={() => clearError("fullname")}
          autoComplete="name"
        />

        <TextInput
          label={t("personalStep.dobLabel")}
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
            {t("personalStep.genderLabel")}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {genders.map((g) => {
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
