import { type Dispatch, type SetStateAction, useState } from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RegisterData } from "./types";
import { TextInput } from "../ui/Input";

interface AuthStepProps {
  formData: RegisterData;
  setFormData: Dispatch<SetStateAction<RegisterData>>;
  confirmPassword: string;
  setConfirmPassword: Dispatch<SetStateAction<string>>;
  errors?: {
    username?: string;
    password?: string;
    confirmPassword?: string;
  };
  setErrors?: (errors: any) => void;
}

export default function AuthStep({
  formData,
  setFormData,
  confirmPassword,
  setConfirmPassword,
  errors = {},
  setErrors = () => {},
}: AuthStepProps) {
  const { t } = useTranslation("auth");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const clearError = (field: keyof typeof errors) => {
    setErrors({ [field]: undefined });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="font-display text-2xl text-[#faf6ee] tracking-[-0.015em]">
          {t("authStep.title")}
        </h2>
        <p className="mt-2 text-sm text-[#faf6ee]/60">
          {t("authStep.subtitle")}
        </p>
      </div>

      <div className="space-y-5">
        <TextInput
          label={t("authStep.usernameLabel")}
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          placeholder={t("authStep.usernamePlaceholder")}
          error={errors.username}
          onClearError={() => clearError("username")}
          leadingIcon={<User className="w-4 h-4" strokeWidth={1.5} />}
          autoComplete="username"
        />

        <TextInput
          label={t("authStep.passwordLabel")}
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          placeholder={t("authStep.passwordPlaceholder")}
          error={errors.password}
          onClearError={() => clearError("password")}
          hint={!errors.password ? t("authStep.passwordHint") : undefined}
          leadingIcon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="w-9 h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center transition-colors"
              aria-label={
                showPassword
                  ? t("authStep.hidePassword")
                  : t("authStep.showPassword")
              }
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Eye className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>
          }
          autoComplete="new-password"
        />

        <TextInput
          label={t("authStep.confirmPasswordLabel")}
          type={showConfirm ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t("authStep.confirmPasswordPlaceholder")}
          error={errors.confirmPassword}
          onClearError={() => clearError("confirmPassword")}
          leadingIcon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
          trailing={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="w-9 h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center transition-colors"
              aria-label={
                showConfirm
                  ? t("authStep.hideConfirmPassword")
                  : t("authStep.showConfirmPassword")
              }
            >
              {showConfirm ? (
                <EyeOff className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Eye className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>
          }
          autoComplete="new-password"
        />
      </div>
    </div>
  );
}
