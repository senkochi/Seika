import { useState } from "react";
import { CalendarDays, ImageUp } from "lucide-react";
import StudentActionButton from "@/components/student/StudentActionButton";

function StudentProfile() {
  const [formData, setFormData] = useState({
    userId: "student_001",
    fullName: "Alex Nguyen",
    username: "alex_nguyen",
    dateOfBirth: "2005-08-14",
    gender: "Male",
    createdAt: "2026-01-18",
    updatedAt: "2026-05-16",
    profilePictureUrl:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  });

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    }).format(new Date(value));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Profile submitted:", formData);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[var(--foreground)] mb-2">
          Profile
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Update your personal information and avatar.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 shadow-[0_20px_60px_rgba(10,10,20,0.18)]">
            <div className="flex items-center gap-4 mb-6">
              <img
                src={formData.profilePictureUrl}
                alt="Profile avatar"
                className="w-24 h-24 rounded-3xl object-cover border border-[var(--border)]"
              />
              <div>
                <p className="text-[var(--muted-foreground)] text-sm">
                  Student Profile
                </p>
                <h2 className="text-2xl font-black text-[var(--foreground)]">
                  {formData.fullName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm">
                  Username
                </div>
                <p className="text-[var(--foreground)] font-black">
                  {formData.username}
                </p>
                <p className="text-[var(--muted-foreground)] text-sm">
                  Keep this information consistent with your account details.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 shadow-[0_20px_60px_rgba(10,10,20,0.18)]">
            <h3 className="text-lg font-black text-[var(--foreground)] mb-4">
              Profile Dates
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[var(--muted-foreground)] mb-1">
                  Created Date
                </p>
                <p className="font-black text-[var(--foreground)]">
                  {formatDate(formData.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)] mb-1">
                  Updated Date
                </p>
                <p className="font-black text-[var(--foreground)]">
                  {formatDate(formData.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-8 shadow-[0_20px_60px_rgba(10,10,20,0.18)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <CalendarDays className="w-6 h-6 text-[var(--primary)]" />
            <h2 className="text-2xl font-black text-[var(--foreground)]">
              Edit Profile
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-1">
              <span className="text-sm font-bold text-[var(--muted-foreground)]">
                Username
              </span>
              <input
                type="text"
                value={formData.username}
                readOnly
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--second-card)] px-4 py-3 text-[var(--foreground)] outline-none"
              />
            </label>

            <label className="space-y-2 md:col-span-1">
              <span className="text-sm font-bold text-[var(--muted-foreground)]">
                Full Name
              </span>
              <input
                type="text"
                value={formData.fullName}
                onChange={(event) =>
                  setFormData({ ...formData, fullName: event.target.value })
                }
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--second-card)] px-4 py-3 text-[var(--primary-foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)]"
                placeholder="Your full name"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-[var(--muted-foreground)]">
                Date of Birth
              </span>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(event) =>
                  setFormData({ ...formData, dateOfBirth: event.target.value })
                }
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--second-card)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--ring)]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-[var(--muted-foreground)]">
                Gender
              </span>
              <select
                value={formData.gender}
                onChange={(event) =>
                  setFormData({ ...formData, gender: event.target.value })
                }
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--second-card)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--ring)]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold text-[var(--muted-foreground)]">
                Profile Picture URL
              </span>
              <div className="relative">
                <ImageUp className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  type="url"
                  value={formData.profilePictureUrl}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      profilePictureUrl: event.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--second-card)] px-4 py-3 pl-12 text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)]"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </label>
          </div>

          <div className="mt-8 flex justify-end">
            <StudentActionButton size="lg" className="px-8" type="submit">
              Save Changes
            </StudentActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentProfile;
