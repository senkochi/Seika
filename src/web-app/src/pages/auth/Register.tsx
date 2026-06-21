import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

import RegistrationBox from "../../components/auth/RegistrationBox";
import { RegisterData } from "../../components/auth/types";
import { showError, showSuccess } from "../../components/toast/toastUtils";
import { register } from "../../store/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isSubmitting = useAppSelector(
    (state) => state.auth.status === "loading",
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegisterData>({
    role: null,
    fullname: "",
    dateOfBirth: "",
    gender: "",
    username: "",
    password: "",
  });

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.role) {
        showError("Please select your role.");
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.fullname) {
        showError("Full name is required.");
        return;
      }
      if (!formData.dateOfBirth) {
        showError("Date of birth is required.");
        return;
      }
      if (!formData.gender) {
        showError("Please select your gender.");
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate("/");
      return;
    }

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate all fields
    if (!formData.role) {
      showError("Please select your role.");
      return;
    }
    if (!formData.fullname) {
      showError("Full name is required.");
      return;
    }
    if (!formData.dateOfBirth) {
      showError("Date of birth is required.");
      return;
    }
    if (!formData.gender) {
      showError("Please select your gender.");
      return;
    }
    if (!formData.username) {
      showError("Username is required.");
      return;
    }
    if (!formData.password) {
      showError("Password is required.");
      return;
    }

    // You can add more validation here (e.g., password strength, username format)

    try {
      const authState = await dispatch(
        register({
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role,
          fullName: formData.fullname.trim(),
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
        }),
      ).unwrap();

      showSuccess("Account created successfully.");

      const isTeacher = authState.roles.some(
        (role) =>
          role.toUpperCase() === "ROLE_TEACHER" ||
          role.toUpperCase() === "TEACHER",
      );
      navigate(isTeacher ? "/teacher/dashboard" : "/student/dashboard");
    } catch (error) {
      showError(
        typeof error === "string"
          ? error
          : "Registration failed. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 via-30% to-amber-600 via-60% to-violet-950 relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-violet-400 rounded-full opacity-10 blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-20 right-10 w-40 h-40 bg-violet-500 rounded-full opacity-10 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-400 rounded-full opacity-5 blur-2xl"></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-violet-500 rounded-full opacity-10 blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-10 left-1/4 w-48 h-48 bg-violet-500 rounded-full opacity-10 blur-3xl animate-pulse"
        style={{ animationDelay: "0.5s" }}
      ></div>
      {/* Back to Home Button */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 z-50 px-4 py-2 text-white opacity-80 hover:opacity-100 hover:underline flex items-center gap-2 transition-all"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Back to Home</span>
      </button>

      <RegistrationBox
        currentStep={currentStep}
        formData={formData}
        setFormData={setFormData}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
