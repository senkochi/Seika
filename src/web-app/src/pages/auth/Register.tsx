import { FormEvent, useMemo, useState } from 'react'
import { GraduationCap, School } from 'lucide-react'

import AuthInputField from '../../components/auth/AuthInputField'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthSelectField from '../../components/auth/AuthSelectField'
import AuthStepActions from '../../components/auth/AuthStepActions'
import AuthStepIndicator from '../../components/auth/AuthStepIndicator'
import RoleOptionCard from '../../components/auth/RoleOptionCard'

type Role = 'TEACHER' | 'STUDENT' | ''
type Gender = 'MALE' | 'FEMALE' | 'OTHER' | ''

interface RegisterFormData {
  role: Role
  fullName: string
  dateOfBirth: string
  gender: Gender
  username: string
  password: string
}

const steps = ['Role', 'Personal', 'Credentials']

const initialFormData: RegisterFormData = {
  role: '',
  fullName: '',
  dateOfBirth: '',
  gender: '',
  username: '',
  password: '',
}

export default function Register() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<RegisterFormData>(initialFormData)

  const canProceed = useMemo(() => {
    if (currentStep === 0) {
      return formData.role !== ''
    }
    if (currentStep === 1) {
      return formData.fullName.trim() !== '' && formData.dateOfBirth !== '' && formData.gender !== ''
    }
    return formData.username.trim() !== '' && formData.password.trim() !== ''
  }, [currentStep, formData])

  const handleBack = () => setCurrentStep((prev) => Math.max(0, prev - 1))

  const handleNext = () => {
    if (!canProceed) return
    setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canProceed) return
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold tracking-tight text-white">Create your account</h1>
      <p className="mt-2 text-sm text-white/75">Complete the 3-step registration to join Seika.</p>

      <AuthStepIndicator steps={steps} currentStep={currentStep} />

      <form onSubmit={handleSubmit}>
        {currentStep === 0 && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RoleOptionCard
              label="TEACHER"
              selected={formData.role === 'TEACHER'}
              icon={<School className="size-8" />}
              onSelect={() => setFormData((prev) => ({ ...prev, role: 'TEACHER' }))}
            />
            <RoleOptionCard
              label="STUDENT"
              selected={formData.role === 'STUDENT'}
              icon={<GraduationCap className="size-8" />}
              onSelect={() => setFormData((prev) => ({ ...prev, role: 'STUDENT' }))}
            />
          </section>
        )}

        {currentStep === 1 && (
          <section className="space-y-4">
            <AuthInputField
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))}
            />
            <AuthInputField
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(event) => setFormData((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
            />
            <AuthSelectField
              label="Gender"
              value={formData.gender}
              onChange={(event) => setFormData((prev) => ({ ...prev, gender: event.target.value as Gender }))}
              options={[
                { label: 'Select gender', value: '' },
                { label: 'Male', value: 'MALE' },
                { label: 'Female', value: 'FEMALE' },
                { label: 'Other', value: 'OTHER' },
              ]}
            />
          </section>
        )}

        {currentStep === 2 && (
          <section className="space-y-4">
            <AuthInputField
              label="Username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
            />
            <AuthInputField
              label="Password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
            />
          </section>
        )}

        <AuthStepActions
          showBack={currentStep > 0}
          isFinalStep={currentStep === steps.length - 1}
          canProceed={canProceed}
          onBack={handleBack}
          onNext={handleNext}
        />
      </form>
    </AuthLayout>
  )
}
