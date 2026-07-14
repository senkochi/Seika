import { type Dispatch, type SetStateAction, useState } from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const clearError = (field: keyof typeof errors) => {
    setErrors({ [field]: undefined });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="font-display text-2xl text-[#faf6ee] tracking-[-0.015em]">
          Last step — your credentials
        </h2>
        <p className="mt-2 text-sm text-[#faf6ee]/60">
          Choose how you'll sign in.
        </p>
      </div>

      <div className="space-y-5">
        <TextInput
          label="Username"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          placeholder="your.username"
          error={errors.username}
          onClearError={() => clearError("username")}
          leadingIcon={<User className="w-4 h-4" strokeWidth={1.5} />}
          autoComplete="username"
        />

        <TextInput
          label="Password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          placeholder="At least 8 characters"
          error={errors.password}
          onClearError={() => clearError("password")}
          hint={
            !errors.password
              ? "Use 8+ characters with a mix of letters and numbers."
              : undefined
          }
          leadingIcon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="w-9 h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
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
          label="Confirm password"
          type={showConfirm ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          error={errors.confirmPassword}
          onClearError={() => clearError("confirmPassword")}
          leadingIcon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
          trailing={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="w-9 h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center transition-colors"
              aria-label={
                showConfirm ? "Hide confirm password" : "Show confirm password"
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