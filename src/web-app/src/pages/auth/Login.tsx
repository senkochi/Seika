import { useState } from "react";
import { Eye, EyeOff, Home, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { showError, showSuccess } from "../../components/toast/toastUtils";
import { login } from "../../store/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

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

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const { valid, newErrors } = validateForm();

    if (valid) {
      try {
        await dispatch(
          login({
            credentials: {
              username: formData.username.trim(),
              password: formData.password,
            },
            rememberMe: formData.rememberMe,
          }),
        ).unwrap();

        showSuccess("Logged in successfully.");
        navigate("/dashboard");
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute top-20 left-10 w-32 h-32 bg-violet-400 rounded-full opacity-10 blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-10 w-40 h-40 bg-violet-500 rounded-full opacity-10 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-400 rounded-full opacity-5 blur-2xl" />
      <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-violet-500 rounded-full opacity-10 blur-3xl animate-pulse" />
      <div
        className="absolute bottom-10 left-1/4 w-48 h-48 bg-violet-500 rounded-full opacity-10 blur-3xl animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />

      <button
        type="button"
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 z-50 px-4 py-2 text-white opacity-80 hover:opacity-100 hover:underline flex items-center gap-2 transition-all"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Back to Home</span>
      </button>

      <div className="w-full max-w-lg bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden relative z-10">
        <div className="bg-gradient-to-r from-purple-900 to-violet-900 px-8 py-6">
          <h1 className="text-2xl font-black text-yellow-400">Welcome Back</h1>
          <p className="text-sm text-purple-200 mt-2">
            Sign in to continue your learning/teaching journey
          </p>
        </div>

        <div className="px-8 py-6 min-h-[300px] space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-purple-900">
              Sign in to Seika
            </h2>
            <p className="text-sm text-gray-600">
              Access quizzes, flashcards, and your coin balance
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-black text-purple-900 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-purple-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    if (errors.username) clearError("username");
                  }}
                  placeholder="Enter your username"
                  className={`w-full pl-11 pr-4 py-3 text-purple-900 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.username
                      ? "border-red-500 bg-red-50 focus:border-red-500"
                      : "border-purple-200 focus:border-purple-500"
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-500 mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-black text-purple-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-purple-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) clearError("password");
                  }}
                  placeholder="Enter your password"
                  className={`w-full pl-11 pr-12 py-3 text-purple-900 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.password
                      ? "border-red-500 bg-red-50 focus:border-red-500"
                      : "border-purple-200 focus:border-purple-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-700 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex items-center gap-2 text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    setFormData({ ...formData, rememberMe: e.target.checked })
                  }
                  className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-purple-700 font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t-2 border-purple-100 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
          <button
            type="button"
            onClick={() => navigate("/auth/register")}
            className="px-6 py-3 flex items-center justify-center gap-2 transition-all text-gray-400 hover:text-purple-900 hover:underline"
          >
            Need an account?
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 rounded-full flex items-center justify-center gap-2 font-black hover:scale-105 transition-all disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
