import { useState } from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { showError, showSuccess } from "../../components/toast/toastUtils";
import { login } from "../../store/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { AuthShell } from "../../components/auth/AuthShell";
import { Button } from "../../components/ui/Button";
import { TextInput } from "../../components/ui/Input";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isSubmitting = useAppSelector(
    (state) => state.auth.status === "loading",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: true,
  });
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required.";
    }
    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return {
      valid: Object.keys(newErrors).length === 0,
      newErrors,
    };
  };

  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const { valid, newErrors } = validateForm();

    if (valid) {
      try {
        const authState = await dispatch(
          login({
            credentials: {
              username: formData.username.trim(),
              password: formData.password,
            },
            rememberMe: formData.rememberMe,
          }),
        ).unwrap();

        showSuccess("Logged in successfully.");

        const isAdmin = authState.roles.some(
          (role) =>
            role.toUpperCase() === "ROLE_ADMIN" || role.toUpperCase() === "ADMIN",
        );
        const isTeacher = authState.roles.some(
          (role) =>
            role.toUpperCase() === "ROLE_TEACHER" ||
            role.toUpperCase() === "TEACHER",
        );
        navigate(
          isAdmin
            ? "/admin/dashboard"
            : isTeacher
              ? "/teacher/dashboard"
              : "/student/dashboard",
        );
      } catch (error) {
        showError(
          typeof error === "string" ? error : "Login failed. Please try again.",
        );
      }
    } else {
      showError(Object.values(newErrors)[0] || "Please fill in all fields.");
    }
  };

  return (
    <AuthShell>
      <div className="p-8 sm:p-10 lg:p-12 space-y-10">
        <header className="space-y-3">
          <span className="eyebrow">
            <span className="inline-block w-1 h-1 rounded-full bg-[#d4a843]" />
            Sign in
          </span>
          <h1
            className="font-display font-medium text-[#faf6ee] text-4xl lg:text-5xl leading-[1.02] tracking-[-0.025em]"
            style={{ textWrap: "balance" as const }}
          >
            Welcome{" "}
            <span className="italic font-display font-light text-[#d4a843]">
              back.
            </span>
          </h1>
          <p className="text-[#faf6ee]/65">
            Pick up where you left off.
          </p>
        </header>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <TextInput
            label="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            placeholder="your.username"
            error={errors.username}
            onClearError={() => clearError("username")}
            leadingIcon={
              <User className="w-4 h-4" strokeWidth={1.5} />
            }
            autoComplete="username"
          />

          <TextInput
            label="Password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="••••••••"
            error={errors.password}
            onClearError={() => clearError("password")}
            leadingIcon={
              <Lock className="w-4 h-4" strokeWidth={1.5} />
            }
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
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between text-sm pt-1">
            <label className="flex items-center gap-3 text-[#faf6ee]/65 cursor-pointer select-none">
              <span className="relative">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    setFormData({ ...formData, rememberMe: e.target.checked })
                  }
                  className="peer sr-only"
                />
                <span className="block w-5 h-5 rounded-md border border-white/15 bg-white/[0.04] peer-checked:bg-gradient-to-br peer-checked:from-[#e6c264] peer-checked:to-[#c89a36] peer-checked:border-[#d4a843] transition-all duration-300 ease-soft" />
                <svg
                  className="absolute inset-0 w-5 h-5 p-1 text-[#1c0f2e] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M3 8.5l3 3 7-7"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Remember me
            </label>
            <button
              type="button"
              className="text-[#d4a843] hover:text-[#f1e4c0] font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              trailing
              loading={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>

        <div className="hairline" />

        <p className="text-sm text-center text-[#faf6ee]/65">
          New here?{" "}
          <button
            type="button"
            onClick={() => navigate("/auth/register")}
            className="text-[#d4a843] hover:text-[#f1e4c0] font-medium transition-colors"
          >
            Create an account
          </button>
        </p>
      </div>
    </AuthShell>
  );
}