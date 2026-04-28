import { Dispatch, SetStateAction } from 'react'
import { RegisterData } from './types'

interface PersonalStepProps {
  formData: RegisterData
  setFormData: Dispatch<SetStateAction<RegisterData>>
}

export default function PersonalStep({ formData, setFormData }: PersonalStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-purple-900">Personal Information</h2>
        <p className="text-sm text-gray-600">Tell us a bit about yourself</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-black text-purple-900 mb-2">Full Name</label>
          <input
            type="text"
            value={formData.fullname}
            onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
            placeholder="Enter your full name"
            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-black text-purple-900 mb-2">Date of Birth</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-black text-purple-900 mb-2">Gender</label>
          <div className="grid grid-cols-3 gap-3">
            {(['male', 'female', 'other'] as const).map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => setFormData({ ...formData, gender })}
                className={`px-4 py-3 rounded-xl border-2 transition-all capitalize ${
                  formData.gender === gender
                    ? 'border-purple-500 bg-purple-50 text-purple-900 font-black'
                    : 'border-purple-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50/50'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
