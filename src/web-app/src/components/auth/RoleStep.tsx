import { Dispatch, SetStateAction } from "react";
import { GraduationCap, User } from "lucide-react";
import { RegisterData } from "./types";

interface RoleStepProps {
  formData: RegisterData;
  setFormData: Dispatch<SetStateAction<RegisterData>>;
  error?: string;
}

export default function RoleStep({
  formData,
  setFormData,
  error: _error,
}: RoleStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-purple-900">
          Choose Your Role
        </h2>
        <p className="text-sm text-gray-600">How will you be using Seika?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, role: "STUDENT" })}
          className={`group p-8 rounded-2xl border-2 transition-all ${
            formData.role === "STUDENT"
              ? "border-purple-500 bg-purple-50 shadow-lg scale-105"
              : "border-purple-200 hover:border-purple-300 hover:bg-purple-50/50"
          }`}
        >
          <div
            className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all ${
              formData.role === "STUDENT"
                ? "bg-gradient-to-br from-purple-500 to-purple-600 rotate-6"
                : "bg-gradient-to-br from-purple-400 to-purple-500 group-hover:rotate-6"
            }`}
          >
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-black text-purple-900">Student</h3>
          <p className="text-sm text-gray-600 mt-2">
            Learn, compete, and earn rewards
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFormData({ ...formData, role: "TEACHER" })}
          className={`group p-8 rounded-2xl border-2 transition-all ${
            formData.role === "TEACHER"
              ? "border-purple-500 bg-purple-50 shadow-lg scale-105"
              : "border-purple-200 hover:border-purple-300 hover:bg-purple-50/50"
          }`}
        >
          <div
            className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all ${
              formData.role === "TEACHER"
                ? "bg-gradient-to-br from-purple-500 to-purple-600 rotate-6"
                : "bg-gradient-to-br from-purple-400 to-purple-500 group-hover:rotate-6"
            }`}
          >
            <User className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-black text-purple-900">Teacher</h3>
          <p className="text-sm text-gray-600 mt-2">
            Create quizzes and track progress
          </p>
        </button>
      </div>
    </div>
  );
}
