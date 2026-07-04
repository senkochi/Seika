import { Dispatch, SetStateAction, useState } from "react";
import { RegisterData } from "./types";
import { Eye, EyeOff, Lock, User } from "lucide-react";

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const clearError = (field: string) => {
    setErrors({ [field]: undefined });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-purple-900">
          Account Security
        </h2>
        <p className="text-sm text-gray-600">Choose your login credentials</p>
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
              placeholder="Choose a unique username"
              className={`w-full pl-11 pr-4 py-3 border-2 text-purple-900 rounded-xl focus:outline-none transition-colors ${
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
            Confirm password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-purple-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) clearError("confirmPassword");
              }}
              placeholder="Confirm your password"
              className={`w-full pl-11 pr-12 py-3 border-2 text-purple-900 rounded-xl focus:outline-none transition-colors ${
                errors.confirmPassword
                  ? "border-red-500 bg-red-50 focus:border-red-500"
                  : "border-purple-200 focus:border-purple-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-700 transition-colors"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">
              {errors.confirmPassword}
            </p>
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
              placeholder="Create a strong password"
              className={`w-full pl-11 pr-12 py-3 border-2 text-purple-900 rounded-xl focus:outline-none transition-colors ${
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
          {errors.password ? (
            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-2">
              Must be at least 8 characters with letters and numbers
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
