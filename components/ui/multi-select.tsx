import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

interface MultiSelectProps {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const selectedOptions = selected
    .map((value) => options.find((opt) => opt.value === value))
    .filter(Boolean) as {
    value: string
    label: string
  }[]

  const displayCount = 2 // Number of badges to display before showing "+X more"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-[250px] justify-between h-auto min-h-[36px] cursor-default',
            className
          )}
        >
          <div className="flex flex-nowrap overflow-hidden gap-1 items-center">
            {selectedOptions.length > 0 ? (
              <>
                {selectedOptions.slice(0, displayCount).map((option) => (
                  <p
                    key={option.value}
                    // variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {option.label}
                    {/* Changed button to span to fix nesting issue */}
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelect(option.value)
                      }}
                      className="rounded-full"
                      aria-label={`Remove ${option.label}`}
                    >
                      <X className="h-3 w-3 text-red-500 cursor-pointer" />
                    </span>
                  </p>
                ))}
                {selectedOptions.length > displayCount && (
                  <Badge variant="secondary">
                    +{selectedOptions.length - displayCount} more
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selected.includes(option.value)
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
