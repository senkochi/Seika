import { Button } from '../ui/button'

interface AuthStepActionsProps {
  showBack: boolean
  isFinalStep: boolean
  canProceed: boolean
  onBack: () => void
  onNext: () => void
}

export default function AuthStepActions({
  showBack,
  isFinalStep,
  canProceed,
  onBack,
  onNext,
}: AuthStepActionsProps) {
  return (
    <div className="mt-8 flex items-center justify-end gap-3">
      {showBack && (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="border-violet-500 bg-violet-900 text-violet-100 hover:bg-violet-800"
        >
          Back
        </Button>
      )}

      <Button
        type={isFinalStep ? 'submit' : 'button'}
        onClick={isFinalStep ? undefined : onNext}
        disabled={!canProceed}
        className="bg-gradient-to-r from-violet-500 to-amber-500 text-white hover:from-violet-400 hover:to-amber-400"
      >
        {isFinalStep ? 'Submit' : 'Next'}
      </Button>
    </div>
  )
}
