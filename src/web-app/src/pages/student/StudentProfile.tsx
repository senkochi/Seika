import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ImageUp,
  Loader2,
  RefreshCcw,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";
import { userProfilesService } from "../../api";
import { showSuccess, showError } from "../../components/toast/toastUtils";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { useTranslation } from "react-i18next";
import { useActiveLocale } from "../../hooks/useActiveLocale";

function StudentProfile() {
  const { t } = useTranslation(["profile", "common"]);
  const locale = useActiveLocale();
  const dateLocale = locale === "vi" ? "vi-VN" : "en-US";
  const dispatch = useAppDispatch();
  const {
    status,
    error,
    userId,
    username,
    fullName,
    dateOfBirth,
    gender,
    profilePictureUrl,
  } = useAppSelector((state) => state.userProfile);

  const [formData, setFormData] = useState({
    fullName: fullName ?? "",
    dateOfBirth: dateOfBirth ?? "",
    gender: gender ?? "Male",
    profilePictureUrl: profilePictureUrl ?? "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync form khi Redux state có data
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [dispatch, status]);

  useEffect(() => {
    if (status === "succeeded") {
      setFormData({
        fullName: fullName ?? "",
        dateOfBirth: dateOfBirth ?? "",
        gender: gender ?? "Male",
        profilePictureUrl: profilePictureUrl ?? "",
      });
    }
  }, [status, fullName, dateOfBirth, gender, profilePictureUrl]);

  const formatDate = (value: string) => {
    if (!value) return "—";
    return new Intl.DateTimeFormat(dateLocale, {
      year: "numeric",
      month: "long",
      day: "2-digit",
    }).format(new Date(value));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;

    try {
      setIsUpdating(true);
      await userProfilesService.update(userId, {
        userId,
        ...formData,
      });
      showSuccess(t("profile:toast.updateSuccess"));
      dispatch(fetchCurrentUserProfile());
    } catch (err) {
      showError(t("profile:toast.updateError"));
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60dvh] font-sans-ui">
        <div className="flex flex-col items-center gap-4 text-white/55">
          <Loader2
            className="w-10 h-10 animate-spin text-[#d4a843]"
            aria-hidden="true"
          />
          <p>{t("profile:loading")}</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60dvh] font-sans-ui">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-9 w-9 text-[#d4a843]" aria-hidden="true" />
          <p className="font-semibold text-cream">{t("profile:errorTitle")}</p>
          {error && <p className="max-w-md text-sm text-white/55">{error}</p>}
          <Button
            variant="primary"
            size="md"
            onClick={() => dispatch(fetchCurrentUserProfile())}
            className="mt-2"
          >
            {t("profile:retryBtn")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 lg:p-8 font-sans-ui">
      <PageHeader
        title={t("profile:header.title")}
        subtitle={t("profile:header.subtitle")}
        actions={
          <Button
            variant="ghost"
            size="md"
            onClick={() => dispatch(fetchCurrentUserProfile())}
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            {t("common:actions.refresh")}
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <SectionCard className="space-y-5">
            <div className="flex items-center gap-4">
              {formData.profilePictureUrl ? (
                <img
                  src={formData.profilePictureUrl}
                  alt="Ảnh đại diện"
                  className="w-16 h-16 rounded-2xl object-cover border border-white/[0.08]"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center font-sans-ui text-xl font-semibold text-cream select-none">
                  {(formData.fullName || username || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-sans-ui text-xs uppercase tracking-[0.12em] text-white/45">
                  {t("profile:card.studentProfile")}
                </p>
                <h2 className="font-sans-ui text-xl font-semibold text-cream truncate">
                  {formData.fullName || username || "—"}
                </h2>
              </div>
            </div>

            <div className="space-y-2 border-t border-white/[0.06] pt-4">
              <p className="font-sans-ui text-xs uppercase tracking-[0.12em] text-white/45">
                {t("profile:card.username")}
              </p>
              <p className="font-sans-ui text-sm font-medium text-cream break-all">
                {username ?? "—"}
              </p>
              <p className="font-sans-ui text-xs text-white/55">
                {t("profile:card.usernameHint")}
              </p>
            </div>
          </SectionCard>

          <SectionCard className="space-y-4">
            <h3 className="font-sans-ui text-base font-semibold text-cream">
              {t("profile:card.accountInfo")}
            </h3>
            <div className="space-y-3 font-sans-ui text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-white/45 mb-1">
                  {t("profile:card.userId")}
                </p>
                <p className="font-mono text-xs text-cream break-all">
                  {userId ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-white/45 mb-1">
                  {t("profile:card.dob")}
                </p>
                <p className="font-medium text-cream">
                  {formData.dateOfBirth
                    ? formatDate(formData.dateOfBirth)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-white/45 mb-1">
                  {t("profile:card.gender")}
                </p>
                <p className="font-medium text-cream">
                  {formData.gender
                    ? t(`profile:gender.${formData.gender}`, {
                        defaultValue: formData.gender,
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <form onSubmit={handleSubmit} className="contents">
          <SectionCard className="space-y-6">
            <div className="flex items-center gap-3">
              <CalendarDays
                className="w-5 h-5 text-[#d4a843]"
                aria-hidden="true"
              />
              <h2 className="font-sans-ui text-lg font-semibold text-cream">
                {t("profile:form.title")}
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 md:col-span-1">
                <span className="font-sans-ui text-xs uppercase tracking-[0.12em] text-white/45">
                  {t("profile:card.username")}
                </span>
                <input
                  type="text"
                  value={username ?? ""}
                  readOnly
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-sans-ui text-sm text-white/45 outline-none cursor-not-allowed"
                />
              </label>

              <label className="space-y-2 md:col-span-1">
                <span className="font-sans-ui text-xs uppercase tracking-[0.12em] text-white/45">
                  {t("profile:form.fullName")}
                </span>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(event) =>
                    setFormData({ ...formData, fullName: event.target.value })
                  }
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 font-sans-ui text-sm text-cream outline-none placeholder:text-white/35 focus:border-[#d4a843]/50 transition-colors"
                  placeholder={t("profile:form.fullNamePlaceholder")}
                />
              </label>

              <label className="space-y-2">
                <span className="font-sans-ui text-xs uppercase tracking-[0.12em] text-white/45">
                  {t("profile:form.dob")}
                </span>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      dateOfBirth: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 font-sans-ui text-sm text-cream outline-none focus:border-[#d4a843]/50 transition-colors"
                />
              </label>

              <label className="space-y-2">
                <span className="font-sans-ui text-xs uppercase tracking-[0.12em] text-white/45">
                  {t("profile:form.gender")}
                </span>
                <select
                  value={formData.gender}
                  onChange={(event) =>
                    setFormData({ ...formData, gender: event.target.value })
                  }
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 font-sans-ui text-sm text-cream outline-none focus:border-[#d4a843]/50 transition-colors"
                >
                  <option value="Male" className="bg-[#1c0f2e] text-cream">
                    {t("profile:gender.Male")}
                  </option>
                  <option value="Female" className="bg-[#1c0f2e] text-cream">
                    {t("profile:gender.Female")}
                  </option>
                  <option value="Other" className="bg-[#1c0f2e] text-cream">
                    {t("profile:gender.Other")}
                  </option>
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="font-sans-ui text-xs uppercase tracking-[0.12em] text-white/45">
                  {t("profile:form.avatarUrl")}
                </span>
                <div className="relative">
                  <ImageUp
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45"
                    aria-hidden="true"
                  />
                  <input
                    type="url"
                    value={formData.profilePictureUrl}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        profilePictureUrl: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 pl-10 font-sans-ui text-sm text-cream outline-none placeholder:text-white/35 focus:border-[#d4a843]/50 transition-colors"
                    placeholder={t("profile:form.avatarPlaceholder")}
                  />
                </div>
              </label>
            </div>

            <div className="flex justify-end border-t border-white/[0.06] pt-5">
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={isUpdating}
              >
                {isUpdating
                  ? t("profile:form.saving")
                  : t("profile:form.saveBtn")}
              </Button>
            </div>
          </SectionCard>
        </form>
      </div>
    </div>
  );
}

export default StudentProfile;
