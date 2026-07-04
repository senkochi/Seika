import { Dispatch, SetStateAction } from "react";
import { RegisterData } from "./types";
import { User } from "lucide-react";

interface PersonalStepProps {
  formData: RegisterData;
  setFormData: Dispatch<SetStateAction<RegisterData>>;
  errors?: {
    fullname?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  setErrors?: (errors: any) => void;
}

export default function PersonalStep({
  formData,
  setFormData,
  errors = {},
  setErrors = () => {},
}: PersonalStepProps) {
  const clearError = (field: string) => {
    setErrors({ [field]: undefined });
  };
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-purple-900">
          Personal Information
        </h2>
        <p className="text-sm text-gray-600">Tell us a bit about yourself</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-black text-purple-900 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-purple-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={formData.fullname}
              onChange={(e) => {
                setFormData({ ...formData, fullname: e.target.value });
                if (errors.fullname) clearError("fullname");
              }}
              placeholder="Enter your full name"
              className={`w-full pl-11 pr-4 py-3 text-purple-900 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.fullname
                  ? "border-red-500 bg-red-50 focus:border-red-500"
                  : "border-purple-200 focus:border-purple-500"
              }`}
            />
          </div>
          {errors.fullname && (
            <p className="text-xs text-red-500 mt-1">{errors.fullname}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-black text-purple-900 mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => {
              setFormData({ ...formData, dateOfBirth: e.target.value });
              if (errors.dateOfBirth) clearError("dateOfBirth");
            }}
            className={`w-full px-4 py-3 border-2 text-purple-900 rounded-xl focus:outline-none transition-colors ${
              errors.dateOfBirth
                ? "border-red-500 bg-red-50 focus:border-red-500"
                : "border-purple-200 focus:border-purple-500"
            }`}
          />
          {errors.dateOfBirth && (
            <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-black text-purple-900 mb-2">
            Gender
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["male", "female", "other"] as const).map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, gender });
                  if (errors.gender) clearError("gender");
                }}
                className={`px-4 py-3 rounded-xl border-2 transition-all capitalize ${
                  formData.gender === gender
                    ? "border-purple-500 bg-purple-50 text-purple-900 font-black"
                    : errors.gender
                      ? "border-red-500 bg-red-50 text-gray-600"
                      : "border-purple-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50/50"
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
          {errors.gender && (
            <p className="text-xs text-red-500 mt-1">{errors.gender}</p>
          )}
        </div>
      </div>
    </div>
  );
}
