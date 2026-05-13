import { Label } from '@/components/ui/label'

interface CustomSwitchProps {
  label?: string
  checked: boolean
  onChange: (checked: boolean) => void
  activeText?: string
  inactiveText?: string
  disabled?: boolean
  className?: string
}

export default function CustomSwitch({
  label,
  checked,
  onChange,
  activeText = 'Active',
  inactiveText = 'Inactive',
  disabled = false,
  className = '',
}: CustomSwitchProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}

      <div className="flex items-center gap-2 h-9">
        <label
          className={`relative inline-flex items-center ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />

          <div className="w-10 h-6 bg-gray-200 rounded-full transition-colors peer-checked:bg-black" />

          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
        </label>

        <span className="text-sm text-muted-foreground">
          {checked ? activeText : inactiveText}
        </span>
      </div>
    </div>
  )
}
