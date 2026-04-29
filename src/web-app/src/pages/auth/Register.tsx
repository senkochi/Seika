import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

import RegistrationBox from "../../components/auth/RegistrationBox";
import { RegisterData } from "../../components/auth/types";

export default function Register() {
  const navigate = useNavigate();
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

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    // Handle form submission here
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
      />
    </div>
  );
}
