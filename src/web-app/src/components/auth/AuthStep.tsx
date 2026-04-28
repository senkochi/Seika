import { Dispatch, SetStateAction } from 'react'
import { RegisterData } from './types'

interface AuthStepProps {
  formData: RegisterData
  setFormData: Dispatch<SetStateAction<RegisterData>>
}

export default function AuthStep({ formData, setFormData }: AuthStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-purple-900">Account Security</h2>
        <p className="text-sm text-gray-600">Choose your login credentials</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-black text-purple-900 mb-2">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Choose a unique username"
            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-black text-purple-900 mb-2">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Create a strong password"
            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
          />
          <p className="text-xs text-gray-500 mt-2">Must be at least 8 characters with letters and numbers</p>
        </div>
      </div>
    </div>
  )
}
