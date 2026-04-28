import { Dispatch, SetStateAction } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import RoleStep from './RoleStep'
import PersonalStep from './PersonalStep'
import AuthStep from './AuthStep'
import ProgressBar from './ProgressBar'
import { RegisterData } from './types'

interface RegistrationBoxProps {
  currentStep: number
  formData: RegisterData
  setFormData: Dispatch<SetStateAction<RegisterData>>
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
}

export default function RegistrationBox({
  currentStep,
  formData,
  setFormData,
  onBack,
  onNext,
  onSubmit,
}: RegistrationBoxProps) {
  return (
    <div className="w-full max-w-lg bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden relative z-10">
      <div className="bg-gradient-to-r from-purple-900 to-violet-900 px-8 py-6">
        <h1 className="text-2xl font-black text-yellow-400">Create Your Account</h1>
        <p className="text-sm text-purple-200 mt-2">Step {currentStep} of 3</p>
      </div>

      <ProgressBar currentStep={currentStep} />

      <div className="px-8 py-6 min-h-[300px]">
        {currentStep === 1 && <RoleStep formData={formData} setFormData={setFormData} />}
        {currentStep === 2 && <PersonalStep formData={formData} setFormData={setFormData} />}
        {currentStep === 3 && <AuthStep formData={formData} setFormData={setFormData} />}
      </div>

      <div className="px-8 py-6 bg-gray-50 border-t-2 border-purple-100 flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          disabled={currentStep === 1}
          className={`px-6 py-3 flex items-center gap-2 transition-all ${
            currentStep === 1 ? 'text-gray-400' : 'text-gray-400 hover:text-purple-900 hover:underline'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {currentStep < 3 ? (
          <button
            type="button"
            onClick={onNext}
            disabled={
              (currentStep === 1 && !formData.role) ||
              (currentStep === 2 && (!formData.fullname || !formData.dateOfBirth || !formData.gender))
            }
            className="px-8 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 rounded-full flex items-center gap-2 font-black hover:scale-105 transition-all"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!formData.username || !formData.password}
            className="px-8 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-900 rounded-full font-black hover:scale-105 transition-all"
          >
            Create Account
          </button>
        )}
      </div>
    </div>
  );
}