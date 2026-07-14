import { type Dispatch, type SetStateAction, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import RoleStep from "./RoleStep";
import PersonalStep from "./PersonalStep";
import AuthStep from "./AuthStep";
import ProgressBar from "./ProgressBar";
import { RegisterData } from "./types";
import { showError } from "../toast/toastUtils";
import { Button } from "../ui/Button";

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

    if (currentStep === 1 && !formData.role) {
      newErrors.role = "Please select your role.";
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
      } else if (formData.password !== confirmPassword) {
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
    <div className="space-y-2">
      <ProgressBar currentStep={currentStep} />

      <div className="px-8 sm:px-10 lg:px-12 py-8 min-h-[380px]">
        {currentStep === 1 && (
          <RoleStep
            formData={formData}
            setFormData={setFormData}
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

      <div className="px-8 sm:px-10 lg:px-12 pb-8 pt-2 border-t border-white/[0.06] flex justify-between items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-[#faf6ee]/55 hover:text-[#faf6ee] transition-colors duration-300 ease-soft"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          {currentStep === 1 ? "Back home" : "Back"}
        </button>

        {currentStep < 3 ? (
          <Button variant="primary" trailing onClick={handleNext}>
            Continue
            <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
          </Button>
        ) : (
          <Button
            variant="primary"
            trailing
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Creating..." : "Create account"}
          </Button>
        )}
      </div>
    </div>
  );
}