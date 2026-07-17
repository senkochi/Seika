import { useEffect, useState } from "react";
import { Calendar, Edit3, Loader2, Save, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { userProfilesService } from "../../../api";
import { showError, showSuccess } from "../../toast/toastUtils";

interface TeacherProfileFormProps {
  userId?: string | null;
  profileId?: string | null;
  initialFullName?: string;
  initialDateOfBirth?: string;
  initialGender?: string;
  initialProfilePictureUrl?: string;
  onSaved: () => void;
}

function TeacherProfileForm({
  userId,
  profileId,
  initialFullName = "",
  initialDateOfBirth = "",
  initialGender = "Other",
  initialProfilePictureUrl = "",
  onSaved,
}: TeacherProfileFormProps) {
  const { t } = useTranslation("teacher");
  const [isEditing, setIsEditing] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [fullName, setFullName] = useState(initialFullName);
  const [dateOfBirth, setDateOfBirth] = useState(initialDateOfBirth);
  const [gender, setGender] = useState(initialGender);
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    initialProfilePictureUrl,
  );

  useEffect(() => {
    if (!isEditing) {
      setFullName(initialFullName);
      setDateOfBirth(initialDateOfBirth);
      setGender(initialGender || "Other");
      setProfilePictureUrl(initialProfilePictureUrl);
    }
  }, [
    isEditing,
    initialFullName,
    initialDateOfBirth,
    initialGender,
    initialProfilePictureUrl,
  ]);

  const handleCancel = () => {
    setIsEditing(false);
    setFullName(initialFullName);
    setDateOfBirth(initialDateOfBirth);
    setGender(initialGender || "Other");
    setProfilePictureUrl(initialProfilePictureUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!fullName.trim()) return showError(t("profile.errorNameRequired"));
    if (!dateOfBirth) return showError(t("profile.errorDobRequired"));

    setLoadingSubmit(true);
    try {
      const payload = {
        userId,
        fullName,
        dateOfBirth,
        gender,
        profilePictureUrl: profilePictureUrl || undefined,
      };
      if (profileId) {
        await userProfilesService.update(userId, payload);
      } else {
        await userProfilesService.create(payload);
      }
      showSuccess(t("profile.successUpdate"));
      setIsEditing(false);
      onSaved();
    } catch (err) {
      console.error(err);
      showError(t("profile.errorUpdate"));
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-8">
      <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
        <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
          <User className="w-5 h-5 text-[var(--primary)]" />
          {t("profile.formTitle")}
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-xl text-xs font-semibold hover:bg-purple-900/60 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {t("profile.editBtn")}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--muted-foreground)] mb-2">
            {t("profile.fullNameLabel")}
          </label>
          <input
            type="text"
            disabled={!isEditing}
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-2">
              {t("profile.dobLabel")}
            </label>
            <div className="relative">
              <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="date"
                disabled={!isEditing}
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-2">
              {t("profile.genderLabel")}
            </label>
            <select
              disabled={!isEditing}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="Male" className="bg-[var(--card)]">
                {t("profile.genderMale")}
              </option>
              <option value="Female" className="bg-[var(--card)]">
                {t("profile.genderFemale")}
              </option>
              <option value="Other" className="bg-[var(--card)]">
                {t("profile.genderOther")}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted-foreground)] mb-2">
            {t("profile.avatarUrlLabel")}
          </label>
          <input
            type="url"
            disabled={!isEditing}
            placeholder={t("profile.avatarUrlPlaceholder")}
            value={profilePictureUrl}
            onChange={(e) => setProfilePictureUrl(e.target.value)}
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {isEditing && (
          <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
            >
              {t("profile.cancelBtn")}
            </button>
            <button
              type="submit"
              disabled={loadingSubmit}
              className="px-8 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {loadingSubmit ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t("profile.saveBtn")}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default TeacherProfileForm;
