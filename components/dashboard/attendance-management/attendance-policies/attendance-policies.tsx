'use client'

import type React from 'react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpDown, Search, ClipboardList, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateAttendancePolicyType,
  GetAttendancePolicyType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddAttendancePolicy,
  useDeleteAttendancePolicy,
  useGetAttendancePolicies,
  useGetWeekDays,
  useUpdateAttendancePolicy,
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

// ─── Week day checkbox list ───────────────────────────────────────────────────
type WeekDayItem = { id: number; label: string }

const WeekDayCheckboxes = ({
  weekDays,
  selected,
  onChange,
}: {
  weekDays: WeekDayItem[]
  selected: number[]
  onChange: (ids: number[]) => void
}) => {
  const toggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((d) => d !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {weekDays.map((day) => {
        const active = selected.includes(day.id)
        return (
          <button
            key={day.id}
            type="button"
            onClick={() => toggle(day.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              active
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {day.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Number input helper ──────────────────────────────────────────────────────
const NumberField = ({
  label,
  name,
  value,
  onChange,
  suffix = 'min',
}: {
  label: string
  name: string
  value: number | undefined
  onChange: (name: string, value: number) => void
  suffix?: string
}) => (
  <div className="space-y-1">
    <Label htmlFor={name} className="text-xs text-gray-500">
      {label}
    </Label>
    <div className="flex items-center gap-1">
      <Input
        id={name}
        name={name}
        type="number"
        min={0}
        value={value ?? 0}
        onChange={(e) => onChange(name, Number(e.target.value))}
        className="h-8 text-sm"
      />
      <span className="text-xs text-gray-400 whitespace-nowrap">{suffix}</span>
    </div>
  </div>
)

// ─── Default form state ───────────────────────────────────────────────────────
const defaultForm = (userId: number): CreateAttendancePolicyType => ({
  code: '',
  name: '',
  graceMinutes: 0,
  lateAfterMinutes: 0,
  halfDayAfterMinutes: 120,
  absentAfterMinutes: 240,
  allowOvertime: false,
  overtimeAfterMinutes: 480,
  maxOvertimeMinutes: 240,
  allowCompOff: false,
  isActive: true,
  holidayCalendarId: null,
  createdBy: userId,
  weekDayIds: [],
})

// ─── Main component ───────────────────────────────────────────────────────────
const AttendancePolicies = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: policies } = useGetAttendancePolicies()
  const { data: weekDaysData } = useGetWeekDays()
  const { data: holidayCalendarsData } = useGetHolidayCalendars()

  const weekDays: WeekDayItem[] = useMemo(
    () =>
      weekDaysData?.data?.map((d: any) => ({
        id: d.weekDayId,
        label: d.day,
      })) ?? [],
    [weekDaysData]
  )

  const holidayCalendars: { id: number; label: string }[] = useMemo(
    () =>
      holidayCalendarsData?.data?.map((c: any) => ({
        id: c.id,
        label: c.name ? `${c.name} (${c.year})` : `Calendar ${c.id} (${c.year})`,
      })) ?? [],
    [holidayCalendarsData]
  )

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [formData, setFormData] = useState<CreateAttendancePolicyType>(
    defaultForm(userData?.userId || 0)
  )

  useEffect(() => {
    if (userData?.userId) {
      setFormData((prev) => ({ ...prev, createdBy: userData.userId }))
    }
  }, [userData?.userId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (name: string, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleWeekDayChange = (ids: number[]) => {
    setFormData((prev) => ({ ...prev, weekDayIds: ids }))
  }

  const resetForm = useCallback(() => {
    setFormData(defaultForm(userData?.userId || 0))
    setEditingId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddAttendancePolicy({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateAttendancePolicy({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteAttendancePolicy({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = () => {
    setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
  }

  const filtered = useMemo(() => {
    if (!policies?.data) return []
    return policies.data.filter(
      (p: GetAttendancePolicyType) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [policies?.data, searchTerm])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) =>
      sortDirection === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    )
  }, [filtered, sortDirection])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * perPage
    return sorted.slice(start, start + perPage)
  }, [sorted, currentPage, perPage])

  const totalPages = Math.ceil(sorted.length / perPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      try {
        if (isEditMode && editingId) {
          updateMutation.mutate({
            id: editingId,
            data: {
              ...formData,
              updatedBy: userData?.userId || 0,
            } as any,
          })
        } else {
          addMutation.mutate({
            ...formData,
            createdBy: userData?.userId || 0,
          })
        }
      } catch (err) {
        setError('Failed to save attendance policy')
        console.error(err)
      }
    },
    [formData, isEditMode, editingId, addMutation, updateMutation, userData]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving attendance policy')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (policy: GetAttendancePolicyType) => {
    setFormData({
      code: policy.code,
      name: policy.name,
      graceMinutes: policy.graceMinutes ?? 0,
      lateAfterMinutes: policy.lateAfterMinutes ?? 0,
      halfDayAfterMinutes: policy.halfDayAfterMinutes ?? 120,
      absentAfterMinutes: policy.absentAfterMinutes ?? 240,
      allowOvertime: policy.allowOvertime ?? false,
      overtimeAfterMinutes: policy.overtimeAfterMinutes ?? 480,
      maxOvertimeMinutes: policy.maxOvertimeMinutes ?? 240,
      allowCompOff: policy.allowCompOff ?? false,
      isActive: policy.isActive ?? true,
      holidayCalendarId: policy.holidayCalendarId ?? null,
      createdBy: userData?.userId || 0,
      weekDayIds: policy.weekends?.map((w) => w.weekDayId) ?? [],
    })
    setEditingId(policy.id)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <ClipboardList className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Attendance Policies</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-blue-400 hover:bg-blue-500 text-black"
            onClick={() => setIsPopupOpen(true)}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead onClick={handleSort} className="cursor-pointer">
                Policy Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Grace (min)</TableHead>
              <TableHead>Late After (min)</TableHead>
              <TableHead>Overtime</TableHead>
              <TableHead>Weekend Days</TableHead>
              <TableHead>Holiday Calendar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!policies || policies.data == null ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  Loading policies...
                </TableCell>
              </TableRow>
            ) : policies.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  No attendance policies found
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  No policies match your search
                </TableCell>
              </TableRow>
            ) : (
              paginated.map(
                (policy: GetAttendancePolicyType, index: number) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      {(currentPage - 1) * perPage + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{policy.name}</TableCell>
                    <TableCell>{policy.code}</TableCell>
                    <TableCell>{policy.graceMinutes ?? 0}</TableCell>
                    <TableCell>{policy.lateAfterMinutes ?? 0}</TableCell>
                    <TableCell>
                      {policy.allowOvertime ? (
                        <span className="text-green-600 text-xs font-medium">Yes</span>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {policy.weekends && policy.weekends.length > 0 ? (
                          policy.weekends.map((w) => (
                            <span
                              key={w.id}
                              className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs"
                            >
                              {w.day}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </TableCell>
                    {/* ✅ Holiday Calendar column */}
                    <TableCell>
                      {policy.holidayCalendarName ? (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">
                          {policy.holidayCalendarName} ({policy.holidayCalendarYear})
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {policy.isActive ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => handleEditClick(policy)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setDeletingId(policy.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, index) => {
                if (
                  index === 0 ||
                  index === totalPages - 1 ||
                  (index >= currentPage - 2 && index <= currentPage + 2)
                ) {
                  return (
                    <PaginationItem key={`page-${index}`}>
                      <PaginationLink
                        onClick={() => setCurrentPage(index + 1)}
                        isActive={currentPage === index + 1}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                } else if (index === currentPage - 3 || index === currentPage + 3) {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationLink>...</PaginationLink>
                    </PaginationItem>
                  )
                }
                return null
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add / Edit Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Attendance Policy' : 'Add Attendance Policy'}
        size="sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g. AP001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                Policy Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. General Policy"
                required
              />
            </div>
          </div>

          {/* Timing thresholds */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Timing Thresholds</p>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Grace Period"
                name="graceMinutes"
                value={formData.graceMinutes}
                onChange={handleNumberChange}
              />
              <NumberField
                label="Late After"
                name="lateAfterMinutes"
                value={formData.lateAfterMinutes}
                onChange={handleNumberChange}
              />
              <NumberField
                label="Half Day After"
                name="halfDayAfterMinutes"
                value={formData.halfDayAfterMinutes}
                onChange={handleNumberChange}
              />
              <NumberField
                label="Absent After"
                name="absentAfterMinutes"
                value={formData.absentAfterMinutes}
                onChange={handleNumberChange}
              />
            </div>
          </div>

          {/* Overtime section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Allow Overtime</Label>
              <Switch
                checked={formData.allowOvertime ?? false}
                onChange={(e) =>
                  handleSwitchChange('allowOvertime', (e.target as HTMLInputElement).checked)
                }
              />
            </div>
            {formData.allowOvertime && (
              <div className="grid grid-cols-2 gap-3 pl-2 border-l-2 border-blue-200">
                <NumberField
                  label="Overtime After"
                  name="overtimeAfterMinutes"
                  value={formData.overtimeAfterMinutes}
                  onChange={handleNumberChange}
                />
                <NumberField
                  label="Max Overtime"
                  name="maxOvertimeMinutes"
                  value={formData.maxOvertimeMinutes}
                  onChange={handleNumberChange}
                />
              </div>
            )}
          </div>

          {/* Comp off */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">Allow Comp Off</Label>
            <Switch
              checked={formData.allowCompOff ?? false}
              onChange={(e) =>
                handleSwitchChange('allowCompOff', (e.target as HTMLInputElement).checked)
              }
            />
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">Active</Label>
            <Switch
              checked={formData.isActive ?? true}
              onChange={(e) =>
                handleSwitchChange('isActive', (e.target as HTMLInputElement).checked)
              }
            />
          </div>

          {/* Weekend days */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Weekend Days</Label>
            <WeekDayCheckboxes
              weekDays={weekDays}
              selected={formData.weekDayIds ?? []}
              onChange={handleWeekDayChange}
            />
          </div>

          {/* ✅ Holiday Calendar */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Holiday Calendar</Label>
            <Select
              value={formData.holidayCalendarId?.toString() ?? 'none'}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  holidayCalendarId: val === 'none' ? null : Number(val),
                }))
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select holiday calendar (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {holidayCalendars.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closePopup}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {addMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Popup>

      {/* Delete dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance policy? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  deleteMutation.mutate({ id: deletingId })
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

export default AttendancePolicies


