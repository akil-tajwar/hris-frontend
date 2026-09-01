'use client'

import type React from 'react'
import { useCallback, useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar as CalendarIcon,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateNewHolidayType,
  GetNewHolidayType,
  GetHolidayCalendarType,
} from '@/utils/type'
import { useInitializeUser } from '@/utils/user'
import {
  useGetNewHolidays,
  useAddNewHolidayRange,
  useUpdateNewHoliday,
  useDeleteNewHoliday,
  useGetHolidayCalendars,
} from '@/hooks/use-api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/utils/conversions'

const HOLIDAY_TYPES = ['PUBLIC', 'RELIGIOUS', 'NATIONAL', 'COMPANY', 'OPTIONAL']

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'R', 'F', 'S']

const TYPE_DOT_CLASSES: Record<string, string> = {
  PUBLIC: 'bg-blue-500',
  RELIGIOUS: 'bg-purple-500',
  NATIONAL: 'bg-green-500',
  COMPANY: 'bg-orange-500',
  OPTIONAL: 'bg-gray-400',
}

const TYPE_ACCENT_CLASSES: Record<string, string> = {
  PUBLIC: 'border-l-blue-500',
  RELIGIOUS: 'border-l-purple-500',
  NATIONAL: 'border-l-green-500',
  COMPANY: 'border-l-orange-500',
  OPTIONAL: 'border-l-gray-400',
}

// ── Date helpers (local time, no UTC drift) ──
const toDateKey = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const holidayDateKey = (dateStr: string) => dateStr.split(' ')[0].split('T')[0]

const isSameDay = (a: Date, b: Date) => toDateKey(a) === toDateKey(b)

type CalendarCell = { date: Date; isCurrentMonth: boolean }

const getCalendarCells = (year: number, month: number): CalendarCell[] => {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const cells: CalendarCell[] = []

  for (let i = startWeekday; i > 0; i--) {
    cells.push({ date: new Date(year, month, 1 - i), isCurrentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    const next = new Date(last)
    next.setDate(last.getDate() + 1)
    cells.push({ date: next, isCurrentMonth: false })
  }

  return cells
}

const getTodayDate = () => new Date().toISOString().split('T')[0]

const Holidays = () => {
  useInitializeUser()

  const searchParams = useSearchParams()
  const calendarIdFromUrl = Number(searchParams.get('calendarId') ?? 0)

  // যদি URL এ calendarId থাকে, dropdown দেখাব না
  const showCalendarDropdown = calendarIdFromUrl === 0

  // ── Calendar list (dropdown এর জন্য) ──
  const { data: calendarsRes } = useGetHolidayCalendars()
  const calendarList: GetHolidayCalendarType[] = useMemo(() => {
    const raw = calendarsRes?.data
    if (!raw || !Array.isArray(raw)) return []
    return raw
  }, [calendarsRes?.data])

  const [selectedCalendarId, setSelectedCalendarId] = useState<number>(0)

  useEffect(() => {
    if (calendarIdFromUrl > 0) {
      setSelectedCalendarId(calendarIdFromUrl)
    } else if (calendarList.length > 0 && selectedCalendarId === 0) {
      setSelectedCalendarId(calendarList[0].id)
    }
  }, [calendarIdFromUrl, calendarList, selectedCalendarId])

  const selectedCalendarLabel = useMemo(() => {
    const cal = calendarList.find((c) => c.id === selectedCalendarId)
    if (!cal) return ''
    return cal.name ? `${cal.name} (${cal.year})` : `Calendar ${cal.year}`
  }, [calendarList, selectedCalendarId])

  // ── Holidays ──
  const { data: holidays } = useGetNewHolidays(selectedCalendarId)

  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // ── Calendar view state ──
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingHolidayId, setEditingHolidayId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingHolidayId, setDeletingHolidayId] = useState<number | null>(
    null
  )

  const [formData, setFormData] = useState<CreateNewHolidayType>({
    calendarId: selectedCalendarId,
    title: '',
    startDate: getTodayDate(),
    endDate: getTodayDate(),
    type: 'PUBLIC',
    isRecurring: false,
    isOptional: false,
    description: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = useCallback(() => {
    setFormData({
      calendarId: selectedCalendarId,
      title: '',
      startDate: getTodayDate(),
      endDate: getTodayDate(),
      type: 'PUBLIC',
      isRecurring: false,
      isOptional: false,
      description: '',
    })
    setEditingHolidayId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [selectedCalendarId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddNewHolidayRange({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateNewHoliday({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteNewHoliday({
    onClose: closePopup,
    reset: resetForm,
  })

  // Client-side filter by selectedCalendarId
  const holidayList: GetNewHolidayType[] = useMemo(() => {
    const raw = holidays?.data
    if (!raw || !Array.isArray(raw)) return []
    if (selectedCalendarId > 0) {
      return raw.filter((h) => h.calendarId === selectedCalendarId)
    }
    return raw
  }, [holidays?.data, selectedCalendarId])

  const filteredHolidays = useMemo(() => {
    return holidayList.filter((h) =>
      h.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [holidayList, searchTerm])

  // ── Group holidays by date key for calendar lookups ──
  const holidaysByDate = useMemo(() => {
    const map = new Map<string, GetNewHolidayType[]>()
    filteredHolidays.forEach((h) => {
      if (!h.date) return
      const key = holidayDateKey(h.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(h)
    })
    return map
  }, [filteredHolidays])

  const calendarCells = useMemo(
    () => getCalendarCells(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth]
  )

  const selectedDateKey = toDateKey(selectedDate)
  const selectedDateHolidays = holidaysByDate.get(selectedDateKey) ?? []

  const monthLabel = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const goToPrevMonth = () => {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    )
  }

  const goToNextMonth = () => {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    )
  }

  const goToToday = () => {
    const today = new Date()
    setVisibleMonth(today)
    setSelectedDate(today)
  }

  const handleSelectDate = (cell: CalendarCell) => {
    setSelectedDate(cell.date)
    if (!cell.isCurrentMonth) {
      setVisibleMonth(
        new Date(cell.date.getFullYear(), cell.date.getMonth(), 1)
      )
    }
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      try {
        if (isEditMode && editingHolidayId) {
          updateMutation.mutate({
            id: editingHolidayId,
            data: {
              title: formData.title,
              type: formData.type,
              isRecurring: formData.isRecurring,
              isOptional: formData.isOptional,
              description: formData.description,
            },
          })
        } else {
          addMutation.mutate({
            ...formData,
            calendarId: selectedCalendarId,
          })
        }
      } catch (err) {
        setError('Failed to save holiday')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingHolidayId,
      addMutation,
      updateMutation,
      selectedCalendarId,
    ]
  )

  const handleEditClick = (holiday: GetNewHolidayType) => {
    setFormData({
      calendarId: holiday.calendarId,
      title: holiday.title,
      startDate: holiday.date?.split(' ')[0]?.split('T')[0] ?? getTodayDate(),
      endDate: holiday.date?.split(' ')[0]?.split('T')[0] ?? getTodayDate(),
      type: holiday.type,
      isRecurring: holiday.isRecurring ?? false,
      isOptional: holiday.isOptional ?? false,
      description: holiday.description ?? '',
    })
    setEditingHolidayId(holiday.id)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  const handleAddForSelectedDate = () => {
    setFormData((prev) => ({
      ...prev,
      calendarId: selectedCalendarId,
      startDate: selectedDateKey,
      endDate: selectedDateKey,
    }))
    setIsEditMode(false)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <CalendarIcon className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Holidays</h2>
            {selectedCalendarLabel && (
              <p className="text-sm text-gray-500">{selectedCalendarLabel}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showCalendarDropdown && (
            <Select
              value={selectedCalendarId > 0 ? String(selectedCalendarId) : ''}
              onValueChange={(val) => {
                setSelectedCalendarId(Number(val))
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Select calendar..." />
              </SelectTrigger>
              <SelectContent>
                {calendarList.map((cal) => (
                  <SelectItem key={cal.id} value={String(cal.id)}>
                    {cal.name
                      ? `${cal.name} (${cal.year})`
                      : `Calendar ${cal.year}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search holidays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Button
            className="bg-blue-400 hover:bg-blue-500 text-black"
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                calendarId: selectedCalendarId,
              }))
              setIsEditMode(false)
              setIsPopupOpen(true)
            }}
            disabled={selectedCalendarId === 0}
          >
            Add
          </Button>
        </div>
      </div>

      {selectedCalendarId === 0 ? (
        <div className="rounded-md border py-10 text-center text-gray-400">
          Please select a calendar to view holidays
        </div>
      ) : holidays === undefined ? (
        <div className="rounded-md border py-10 text-center text-gray-500">
          Loading holidays...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Calendar (left, 3/5) */}
          <div className="lg:col-span-3 rounded-lg border border-gray-300 overflow-hidden">
            {/* Header bar: prev/month/next on left, Today on right */}
            <div className="flex items-center justify-between bg-blue-500 text-white px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/15 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h3 className="text-lg font-semibold tracking-tight w-40 text-center">
                  {monthLabel}
                </h3>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/15 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={goToToday}
                className="text-sm px-3 py-1 rounded-md border border-white/40 hover:bg-white/15 transition-colors"
              >
                Today
              </button>
            </div>

            {/* Weekday header row */}
            <div className="grid grid-cols-7 bg-slate-700">
              {WEEKDAY_LABELS.map((label, i) => (
                <div
                  key={`${label}-${i}`}
                  className="text-center text-sm font-medium text-white py-2 border-l border-slate-600 first:border-l-0"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
              {calendarCells.map((cell, idx) => {
                const key = toDateKey(cell.date)
                const dayHolidays = holidaysByDate.get(key) ?? []
                const hasHoliday = dayHolidays.length > 0
                const isSelected = isSameDay(cell.date, selectedDate)
                const isToday = isSameDay(cell.date, new Date())
                const uniqueTypes = Array.from(
                  new Set(dayHolidays.map((h) => h.type))
                )

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectDate(cell)}
                    className={[
                      'aspect-square border-t border-l border-gray-200 flex flex-col items-center justify-center gap-1 text-sm transition-colors',
                      idx % 7 === 0 ? 'border-l-0' : '',
                      isToday
                        ? 'bg-blue-50'
                        : isSelected
                          ? 'bg-slate-100'
                          : 'hover:bg-gray-50',
                      !cell.isCurrentMonth ? 'opacity-40' : '',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'tabular-nums',
                        hasHoliday
                          ? 'text-red-600 font-semibold'
                          : isToday
                            ? 'text-blue-700 font-bold'
                            : 'text-gray-800',
                      ].join(' ')}
                    >
                      {cell.date.getDate()}
                    </span>
                    <span className="h-1.5 flex items-center gap-0.5">
                      {uniqueTypes.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT_CLASSES[t?.toUpperCase()] ?? 'bg-gray-400'}`}
                        />
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 py-3 border-t border-gray-200 bg-gray-50">
              {HOLIDAY_TYPES.map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT_CLASSES[t.toUpperCase()]}`}
                  />
                  <span className="text-xs text-gray-500">
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected date detail (right, 2/5) */}
          <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs font-medium text-gray-400">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                  })}
                </p>
                <h3 className="text-xl font-semibold tracking-tight text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddForSelectedDate}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {selectedDateHolidays.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center">
                <CalendarIcon className="h-8 w-8 text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">
                  No holiday is assigned in this date
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateHolidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className={[
                      'rounded-md border border-gray-200 border-l-4 pl-3 pr-3 py-3',
                      TYPE_ACCENT_CLASSES[holiday.type?.toUpperCase()] ??
                        'border-l-gray-400',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {holiday.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {holiday.type.charAt(0) +
                            holiday.type.slice(1).toLowerCase()}
                          {holiday.isRecurring ? ' · Recurring yearly' : ''}
                          {holiday.isOptional ? ' · Optional' : ''}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => handleEditClick(holiday)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setDeletingHolidayId(holiday.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {holiday.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {holiday.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Holiday' : 'Add Holiday'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Holiday Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            {isEditMode ? (
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, type: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {HOLIDAY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRecurring ?? false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isRecurring: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm">Recurring (yearly)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isOptional ?? false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isOptional: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm">Optional</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description ?? ''}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closePopup}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {addMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : 'Save'}
            </Button>
          </div>
        </form>
      </Popup>

      {/* Delete Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this holiday? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingHolidayId) {
                  deleteMutation.mutate({ id: deletingHolidayId })
                }
                setIsDeleteDialogOpen(false)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Holidays
