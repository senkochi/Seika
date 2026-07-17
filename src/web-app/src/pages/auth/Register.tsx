import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import RegistrationBox from "../../components/auth/RegistrationBox";
import { RegisterData } from "../../components/auth/types";
import { showError, showSuccess } from "../../components/toast/toastUtils";
import { register } from "../../store/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { AuthShell } from "../../components/auth/AuthShell";

export default function Register() {
  const { t } = useTranslation("auth");
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
    if (currentStep === 1 && !formData.role) {
      showError(t("validation.roleRequired"));
      return;
    }
    if (currentStep === 2) {
      if (!formData.fullname)
        return showError(t("validation.fullnameRequired"));
      if (!formData.dateOfBirth) return showError(t("validation.dobRequired"));
      if (!formData.gender) return showError(t("validation.genderRequired"));
    }
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate("/");
      return;
    }
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!formData.role) return showError(t("validation.roleRequired"));
    if (!formData.fullname) return showError(t("validation.fullnameRequired"));
    if (!formData.dateOfBirth) return showError(t("validation.dobRequired"));
    if (!formData.gender) return showError(t("validation.genderRequired"));
    if (!formData.username) return showError(t("validation.usernameRequired"));
    if (!formData.password) return showError(t("validation.passwordRequired"));

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

      showSuccess(t("toasts.registerSuccess"));

      const isTeacher = authState.roles.some(
        (role) =>
          role.toUpperCase() === "ROLE_TEACHER" ||
          role.toUpperCase() === "TEACHER",
      );
      navigate(isTeacher ? "/teacher/dashboard" : "/student/dashboard");
    } catch (error) {
      showError(
        typeof error === "string" ? error : t("validation.registerFailed"),
      );
    }
  };

  return (
    <AuthShell maxWidth={720}>
      <div className="p-8 sm:p-10 lg:px-12 lg:pt-10">
        <header className="space-y-3 mb-2">
          <span className="eyebrow">
            <span className="inline-block w-1 h-1 rounded-full bg-[#d4a843]" />
            {t("register.eyebrow")}
          </span>
          <h1
            className="font-display font-medium text-[#faf6ee] text-4xl lg:text-5xl leading-[1.02] tracking-[-0.025em]"
            style={{ textWrap: "balance" as const }}
          >
            {t("register.title1")}{" "}
            <span className="italic font-display font-light text-[#d4a843]">
              {t("register.titleHighlight")}
            </span>
          </h1>
          <p className="text-[#faf6ee]/65">{t("register.subtitle")}</p>
        </header>

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
    </AuthShell>
  );
}
