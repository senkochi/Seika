import { Dispatch, SetStateAction, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import RoleStep from "./RoleStep";
import PersonalStep from "./PersonalStep";
import AuthStep from "./AuthStep";
import ProgressBar from "./ProgressBar";
import { RegisterData } from "./types";
import { showError } from "../toast/toastUtils";

interface RegistrationBoxProps {
  currentStep: number;
  formData: RegisterData;
  setFormData: Dispatch<SetStateAction<RegisterData>>;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

type StepErrors = {
  [key: string]: string;
};

export default function RegistrationBox({
  currentStep,
  formData,
  setFormData,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
}: RegistrationBoxProps) {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<StepErrors>({});

  const validateCurrentStep = () => {
    const newErrors: StepErrors = {};

    if (currentStep === 1) {
      if (!formData.role) {
        newErrors.role = "Please select your role.";
      }
    }

    if (currentStep === 2) {
      if (!formData.fullname.trim()) {
        newErrors.fullname = "Full name is required.";
      }
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required.";
      }
      if (!formData.gender) {
        newErrors.gender = "Please select your gender.";
      }
    }

    if (currentStep === 3) {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required.";
      }
      if (!formData.password) {
        newErrors.password = "Password is required.";
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password.";
      }
      if (formData.password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }
    }

    const valid = Object.keys(newErrors).length === 0;
    setErrors(newErrors);
    return { valid, newErrors };
  };

  const handleNext = () => {
    const { valid, newErrors } = validateCurrentStep();
    if (valid) {
      setErrors({});
      onNext();
    } else {
      showError(Object.values(newErrors)[0]);
    }
  };

  const handleSubmit = () => {
    const { valid, newErrors } = validateCurrentStep();
    if (valid) {
      setErrors({});
      onSubmit();
    } else {
      showError(Object.values(newErrors)[0]);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden relative z-10">
      <div className="bg-gradient-to-r from-purple-900 to-violet-900 px-8 py-6">
        <h1 className="text-2xl font-black text-yellow-400">
          Create Your Account
        </h1>
        <p className="text-sm text-purple-200 mt-2">Step {currentStep} of 3</p>
      </div>

      <ProgressBar currentStep={currentStep} />

      <div className="px-8 py-6 min-h-[300px]">
        {currentStep === 1 && (
          <RoleStep
            formData={formData}
            setFormData={setFormData}
            error={errors.role}
          />
        )}
        {currentStep === 2 && (
          <PersonalStep
            formData={formData}
            setFormData={setFormData}
            errors={{
              fullname: errors.fullname,
              dateOfBirth: errors.dateOfBirth,
              gender: errors.gender,
            }}
            setErrors={(newErrors) =>
              setErrors((prev) => ({ ...prev, ...newErrors }))
            }
          />
        )}
        {currentStep === 3 && (
          <AuthStep
            formData={formData}
            setFormData={setFormData}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            errors={{
              username: errors.username,
              password: errors.password,
              confirmPassword: errors.confirmPassword,
            }}
            setErrors={(newErrors) =>
              setErrors((prev) => ({ ...prev, ...newErrors }))
            }
          />
        )}
      </div>

      <div className="px-8 py-6 bg-gray-50 border-t-2 border-purple-100 flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className={`px-6 py-3 flex items-center gap-2 transition-all ${"text-gray-400 hover:text-purple-900 hover:underline"}`}
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStep === 1 ? "Back to Home" : "Back"}
        </button>

        {currentStep < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-8 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 rounded-full flex items-center gap-2 font-black hover:scale-105 transition-all"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-900 rounded-full font-black hover:scale-105 transition-all disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
          >
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        )}
      </div>
    </div>
  );
}
