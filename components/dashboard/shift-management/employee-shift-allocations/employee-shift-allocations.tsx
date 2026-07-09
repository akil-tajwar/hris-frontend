'use client'

import type React from 'react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowUpDown,
  Search,
  CalendarClock,
  Edit2,
  Trash2,
  Users,
  Copy,
  CopyCheck,
  Settings2,
  RefreshCw,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateShiftAllocationType,
  CreateBulkShiftAllocationType,
  GetShiftAllocationType,
  UpdateRecurrenceType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetShiftAllocations,
  useAddSingleShiftAllocation,
  useAddBulkShiftAllocation,
  useUpdateShiftAllocation,
  useDeleteShiftAllocation,
  useUpdateShiftAllocationRecurrence,
  useCopyShiftAllocation,
  useCopyAllActiveAllocations,
  useGetAllEmployees,
  useGetShiftDayAndWeekDays,
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

// ─── Date helpers ─────────────────────────────────────────────────
const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return { year, month: month - 1, day }
}

const padTwo = (n: number) => String(n).padStart(2, '0')

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}`

const DAY_ORDER: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

/**
 * Extract working day numbers (0=Sun..6=Sat) from a shift's weekday list.
 * shiftEntry is one item from useGetShiftDayAndWeekDays data array.
 */
const getWorkingDaysFromShift = (shiftEntry: any): number[] => {
  // ✅ shiftDayConfigs, weekDays, বা days যেটাই হোক
  const days: any[] = shiftEntry?.shiftDayConfigs ?? shiftEntry?.weekDays ?? shiftEntry?.days ?? []
  return days
    .filter((d: any) => d.dayType !== 'Weekend' && (d.weekDay ?? d.day ?? d.weekDay?.day))
    .map((d: any) => DAY_ORDER[d.weekDay ?? d.day ?? d.weekDay?.day] ?? -1)
    .filter((n: number) => n >= 0)
    .sort((a: number, b: number) => a - b)
}

/**
 * Calculate current-week range based on shift's working days.
 * If no working days, falls back to Mon–Sun.
 */
const calcWeekRangeFromShift = (fromDate: string, workingDays: number[]) => {
  const { year, month, day } = parseLocalDate(fromDate)

  const weekStartDay = workingDays.length > 0 ? workingDays[0] : 1 // default Mon
  const weekEndDay = workingDays.length > 0 ? workingDays[workingDays.length - 1] : 0 // default Sun

  const date = new Date(year, month, day)
  const currentDow = date.getDay()

  // Find Monday (or shift's first working day) of the CURRENT week containing fromDate
  let diff = weekStartDay - currentDow
  // If diff > 0, we'd jump forward — we want the start of the CURRENT week, so go back
  if (diff > 0) diff -= 7

  const start = new Date(year, month, day + diff)

  const weekLength =
    weekEndDay >= weekStartDay
      ? weekEndDay - weekStartDay
      : 7 - weekStartDay + weekEndDay

  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + weekLength)

  return { effectiveFrom: fmtDate(start), effectiveTo: fmtDate(end) }
}

const calcMonthRange = (fromDate: string) => {
  const { year, month } = parseLocalDate(fromDate)
  const lastDay = new Date(year, month + 1, 0).getDate()
  return {
    effectiveFrom: `${year}-${padTwo(month + 1)}-01`,
    effectiveTo: `${year}-${padTwo(month + 1)}-${padTwo(lastDay)}`,
  }
}

// ─── Default form states ──────────────────────────────────────────
const defaultSingleForm = (userId: number): CreateShiftAllocationType => ({
  employeeId: 0,
  shiftId: 0,
  effectiveFrom: '',
  effectiveTo: '',
  remarks: '',
  approvedBy: undefined,
  createdBy: userId,
})

const defaultBulkForm = (userId: number): CreateBulkShiftAllocationType => ({
  employeeIds: [],
  shiftId: 0,
  effectiveFrom: '',
  effectiveTo: '',
  remarks: '',
  approvedBy: undefined,
  createdBy: userId,
})

const defaultRecurrenceForm = (): UpdateRecurrenceType => ({
  recurrenceType: null,
  recurrenceActive: false,
})

// ─── Main component ───────────────────────────────────────────────
const ShiftAllocationPage = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: allocations } = useGetShiftAllocations()
  const { data: employeesData } = useGetAllEmployees()
  const { data: shiftsData } = useGetShiftDayAndWeekDays()

  const employees = useMemo(() => employeesData?.data ?? [], [employeesData])
  // const shifts = useMemo(() => shiftsData?.data ?? [], [shiftsData])
  const shifts = useMemo(() => {
  const data = shiftsData?.data ?? []
  console.log('shifts raw data:', JSON.stringify(data[0], null, 2))  // প্রথমটা দেখো
  return data
}, [shiftsData])

  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  // Popup states
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [allocMode, setAllocMode] = useState<'single' | 'bulk'>('single')

  // Recurrence popup
  const [isRecurrencePopupOpen, setIsRecurrencePopupOpen] = useState(false)
  const [recurrenceTargetId, setRecurrenceTargetId] = useState<number | null>(null)
  const [recurrenceForm, setRecurrenceForm] = useState<UpdateRecurrenceType>(defaultRecurrenceForm())

  // Copy All popup
  const [isCopyAllPopupOpen, setIsCopyAllPopupOpen] = useState(false)
  const [copyAllType, setCopyAllType] = useState<'weekly' | 'monthly'>('monthly')

  // Delete
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [singleForm, setSingleForm] = useState<CreateShiftAllocationType>(
    defaultSingleForm(userData?.userId || 0)
  )
  const [bulkForm, setBulkForm] = useState<CreateBulkShiftAllocationType>(
    defaultBulkForm(userData?.userId || 0)
  )

  useEffect(() => {
    if (userData?.userId) {
      setSingleForm((prev) => ({ ...prev, createdBy: userData.userId }))
      setBulkForm((prev) => ({ ...prev, createdBy: userData.userId }))
    }
  }, [userData?.userId])

  const resetForm = useCallback(() => {
    setSingleForm(defaultSingleForm(userData?.userId || 0))
    setBulkForm(defaultBulkForm(userData?.userId || 0))
    setEditingId(null)
    setIsEditMode(false)
    setAllocMode('single')
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    resetForm()
  }, [resetForm])

  const closeRecurrencePopup = useCallback(() => {
    setIsRecurrencePopupOpen(false)
    setRecurrenceTargetId(null)
    setRecurrenceForm(defaultRecurrenceForm())
  }, [])

  // Mutations
  const singleMutation = useAddSingleShiftAllocation({ onClose: closePopup, reset: resetForm })
  const bulkMutation = useAddBulkShiftAllocation({ onClose: closePopup, reset: resetForm })
  const updateMutation = useUpdateShiftAllocation({ onClose: closePopup, reset: resetForm })
  const deleteMutation = useDeleteShiftAllocation({
    onClose: () => setIsDeleteDialogOpen(false),
    reset: () => setDeletingId(null),
  })
  const recurrenceMutation = useUpdateShiftAllocationRecurrence({
    onClose: closeRecurrencePopup,
    reset: () => setRecurrenceForm(defaultRecurrenceForm()),
  })
  const copyMutation = useCopyShiftAllocation()
  const copyAllMutation = useCopyAllActiveAllocations()

  // ─── Helpers ──────────────────────────────────────────────────
const getShiftWorkingDays = useCallback(
  (shiftId: number): number[] => {
    // ✅ s.shift?.shiftId দিয়ে match করো
    const entry = shifts.find((s: any) => s.shift?.shiftId === shiftId)
    return entry ? getWorkingDaysFromShift(entry) : []
  },
  [shifts]
)

  const autoFillDates = useCallback(
    (
      effectiveFrom: string,
      recurrenceType: 'weekly' | 'monthly' | 'none' | undefined,
      shiftId: number
    ): { effectiveFrom: string; effectiveTo: string } | null => {
      if (!effectiveFrom || !recurrenceType || recurrenceType === 'none') return null
      if (recurrenceType === 'monthly') {
        return calcMonthRange(effectiveFrom)
      }
      // weekly — shift-aware
      const workingDays = getShiftWorkingDays(shiftId)
      return calcWeekRangeFromShift(effectiveFrom, workingDays)
    },
    [getShiftWorkingDays]
  )

  // ─── Table helpers ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!allocations?.data) return []
    return allocations.data.filter(
      (a: GetShiftAllocationType) =>
        a.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.shiftName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [allocations?.data, searchTerm])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const nameA = a.employeeName ?? ''
      const nameB = b.employeeName ?? ''
      return sortDirection === 'asc'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA)
    })
  }, [filtered, sortDirection])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * perPage
    return sorted.slice(start, start + perPage)
  }, [sorted, currentPage, perPage])

  const totalPages = Math.ceil(sorted.length / perPage)

  // ─── Single form handlers ──────────────────────────────────────
  const handleSingleChange = (name: string, value: any) =>
    setSingleForm((prev) => ({ ...prev, [name]: value }))

  const handleSingleShiftChange = (shiftId: number) => {
    setSingleForm((prev) => {
      const updated: any = { ...prev, shiftId }
      const recType = (prev as any).recurrenceType
      if (prev.effectiveFrom && recType && recType !== 'none') {
        const range = autoFillDates(prev.effectiveFrom, recType, shiftId)
        if (range) {
          updated.effectiveFrom = range.effectiveFrom
          updated.effectiveTo = range.effectiveTo
        }
      }
      return updated
    })
  }

  const handleSingleRecurrenceChange = (recurrenceType: 'weekly' | 'monthly' | 'none') => {
    setSingleForm((prev) => {
      const updated: any = {
        ...prev,
        recurrenceType: recurrenceType === 'none' ? undefined : recurrenceType,
        recurrenceActive: recurrenceType !== 'none' ? 1 : 0,
      }
      if (prev.effectiveFrom && recurrenceType !== 'none') {
        const range = autoFillDates(prev.effectiveFrom, recurrenceType, prev.shiftId)
        if (range) {
          updated.effectiveFrom = range.effectiveFrom
          updated.effectiveTo = range.effectiveTo
        }
      }
      return updated
    })
  }

  const handleSingleDateChange = (value: string) => {
    setSingleForm((prev) => {
      const updated: any = { ...prev, effectiveFrom: value }
      const recType = (prev as any).recurrenceType
      if (recType && recType !== 'none') {
        const range = autoFillDates(value, recType, prev.shiftId)
        if (range) {
          updated.effectiveFrom = range.effectiveFrom
          updated.effectiveTo = range.effectiveTo
        }
      }
      return updated
    })
  }

  // ─── Bulk form handlers ────────────────────────────────────────
  const handleBulkChange = (name: string, value: any) =>
    setBulkForm((prev) => ({ ...prev, [name]: value }))

  const handleBulkShiftChange = (shiftId: number) => {
    setBulkForm((prev) => {
      const updated: any = { ...prev, shiftId }
      const recType = (prev as any).recurrenceType
      if (prev.effectiveFrom && recType && recType !== 'none') {
        const range = autoFillDates(prev.effectiveFrom, recType, shiftId)
        if (range) {
          updated.effectiveFrom = range.effectiveFrom
          updated.effectiveTo = range.effectiveTo
        }
      }
      return updated
    })
  }

  const handleBulkRecurrenceChange = (recurrenceType: 'weekly' | 'monthly' | 'none') => {
    setBulkForm((prev) => {
      const updated: any = {
        ...prev,
        recurrenceType: recurrenceType === 'none' ? undefined : recurrenceType,
        recurrenceActive: recurrenceType !== 'none' ? 1 : 0,
      }
      if (prev.effectiveFrom && recurrenceType !== 'none') {
        const range = autoFillDates(prev.effectiveFrom, recurrenceType, prev.shiftId)
        if (range) {
          updated.effectiveFrom = range.effectiveFrom
          updated.effectiveTo = range.effectiveTo
        }
      }
      return updated
    })
  }

  const handleBulkDateChange = (value: string) => {
    setBulkForm((prev) => {
      const updated: any = { ...prev, effectiveFrom: value }
      const recType = (prev as any).recurrenceType
      if (recType && recType !== 'none') {
        const range = autoFillDates(value, recType, prev.shiftId)
        if (range) {
          updated.effectiveFrom = range.effectiveFrom
          updated.effectiveTo = range.effectiveTo
        }
      }
      return updated
    })
  }

  const toggleBulkEmployee = (empId: number) => {
    setBulkForm((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(empId)
        ? prev.employeeIds.filter((id) => id !== empId)
        : [...prev.employeeIds, empId],
    }))
  }

  const handleEditClick = (alloc: GetShiftAllocationType) => {
    setSingleForm({
      employeeId: alloc.employeeId,
      shiftId: alloc.shiftId,
      effectiveFrom: alloc.effectiveFrom?.slice(0, 10) ?? '',
      effectiveTo: alloc.effectiveTo?.slice(0, 10) ?? '',
      remarks: alloc.remarks ?? '',
      approvedBy: alloc.approvedBy ?? undefined,
      createdBy: userData?.userId || 0,
    })
    setEditingId(alloc.id)
    setIsEditMode(true)
    setAllocMode('single')
    setIsPopupOpen(true)
  }

  const handleRecurrenceClick = (alloc: GetShiftAllocationType) => {
    setRecurrenceTargetId(alloc.id)
    setRecurrenceForm({
      recurrenceType: alloc.recurrenceType ?? null,
      recurrenceActive: alloc.recurrenceActive === 1,
    })
    setIsRecurrencePopupOpen(true)
  }

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (isEditMode && editingId) {
        updateMutation.mutate({
          id: editingId,
          data: {
            shiftId: singleForm.shiftId,
            effectiveFrom: singleForm.effectiveFrom,
            effectiveTo: singleForm.effectiveTo || undefined,
            remarks: singleForm.remarks || undefined,
            approvedBy: singleForm.approvedBy,
          },
        })
        return
      }
      if (allocMode === 'single') {
        singleMutation.mutate(singleForm)
      } else {
        bulkMutation.mutate(bulkForm)
      }
    },
    [isEditMode, editingId, allocMode, singleForm, bulkForm, singleMutation, bulkMutation, updateMutation]
  )

  const handleRecurrenceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!recurrenceTargetId) return
    recurrenceMutation.mutate({ id: recurrenceTargetId, data: recurrenceForm })
  }

  const isPending =
    singleMutation.isPending || bulkMutation.isPending || updateMutation.isPending

  const singleRecurrenceType = (singleForm as any).recurrenceType as
    | 'weekly'
    | 'monthly'
    | undefined
  const bulkRecurrenceType = (bulkForm as any).recurrenceType as 'weekly' | 'monthly' | undefined

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <CalendarClock className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Shift Allocations</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by employee or shift..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-72"
            />
          </div>
          <Button
            variant="outline"
            className="border-green-400 text-green-700 hover:bg-green-50"
            onClick={() => setIsCopyAllPopupOpen(true)}
          >
            <CopyCheck className="h-4 w-4 mr-1" />
            Copy All
          </Button>
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
              <TableHead
                onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className="cursor-pointer"
              >
                Employee <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Effective From</TableHead>
              <TableHead>Effective To</TableHead>
              <TableHead>Recurrence</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!allocations || allocations.data == null ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No shift allocations found
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((alloc: GetShiftAllocationType, index: number) => (
                <TableRow key={alloc.id}>
                  <TableCell>{(currentPage - 1) * perPage + index + 1}</TableCell>
                  <TableCell className="font-medium">{alloc.employeeName ?? '—'}</TableCell>
                  <TableCell>{alloc.shiftName ?? '—'}</TableCell>
                  <TableCell>{alloc.effectiveFrom?.slice(0, 10)}</TableCell>
                  <TableCell>
                    {alloc.effectiveTo?.slice(0, 10) ?? (
                      <span className="text-gray-400 text-xs">No end date</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {alloc.recurrenceType ? (
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={
                            alloc.recurrenceType === 'weekly'
                              ? 'border-purple-400 text-purple-700 bg-purple-50'
                              : 'border-orange-400 text-orange-700 bg-orange-50'
                          }
                        >
                          {alloc.recurrenceType === 'weekly' ? 'Weekly' : 'Monthly'}
                        </Badge>
                        {alloc.recurrenceActive === 1 && (
                          <span
                            className="w-2 h-2 rounded-full bg-green-500 inline-block"
                            title="Active"
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {alloc.remarks ?? <span className="text-gray-400 text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {alloc.recurrenceType && alloc.recurrenceActive === 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          title="Copy to next period"
                          onClick={() =>
                            copyMutation.mutate({
                              id: alloc.id,
                              createdBy: userData?.userId || 0,
                            })
                          }
                          disabled={copyMutation.isPending}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-600 hover:text-purple-700"
                        title="Recurrence settings"
                        onClick={() => handleRecurrenceClick(alloc)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditClick(alloc)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingId(alloc.id)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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

      {/* ── Add / Edit Popup ── */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Shift Allocation' : 'Add Shift Allocation'}
        size="sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {!isEditMode && (
            <Tabs
              value={allocMode}
              onValueChange={(v) => setAllocMode(v as 'single' | 'bulk')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single Employee</TabsTrigger>
                <TabsTrigger value="bulk">
                  <Users className="h-4 w-4 mr-1" />
                  Bulk Employees
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* ── SINGLE FORM ── */}
          {(allocMode === 'single' || isEditMode) && (
            <div className="space-y-4">
              {!isEditMode && (
                <div className="space-y-2">
                  <Label>
                    Employee <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={String(singleForm.employeeId || '')}
                    onValueChange={(v) => handleSingleChange('employeeId', Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp: any) => (
                        <SelectItem key={emp.employeeId} value={String(emp.employeeId)}>
                           {emp.empCode} - {emp.empFullName} {emp.empDesignation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  Shift <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={String(singleForm.shiftId || '')}
                  onValueChange={(v) =>
                    isEditMode
                      ? handleSingleChange('shiftId', Number(v))
                      : handleSingleShiftChange(Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((s: any) => (
                      <SelectItem key={s.shift?.shiftId} value={String(s.shift?.shiftId)}>
                        {s.shift?.shiftName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recurrence — only on create */}
              {!isEditMode && (
                <div className="space-y-2">
                  <Label>Recurrence</Label>
                  <Select
                    value={singleRecurrenceType ?? 'none'}
                    onValueChange={handleSingleRecurrenceChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Effective From <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={singleForm.effectiveFrom}
                    onChange={(e) =>
                      isEditMode
                        ? handleSingleChange('effectiveFrom', e.target.value)
                        : handleSingleDateChange(e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Effective To
                    {!isEditMode && singleRecurrenceType && (
                      <span className="ml-2 text-xs text-green-600 font-normal">
                        auto-filled
                      </span>
                    )}
                  </Label>
                  <Input
                    type="date"
                    value={singleForm.effectiveTo ?? ''}
                    onChange={(e) => handleSingleChange('effectiveTo', e.target.value)}
                    readOnly={!isEditMode && !!singleRecurrenceType}
                    className={
                      !isEditMode && singleRecurrenceType
                        ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                        : ''
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input
                  placeholder="Optional remarks"
                  value={singleForm.remarks ?? ''}
                  onChange={(e) => handleSingleChange('remarks', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── BULK FORM ── */}
          {allocMode === 'bulk' && !isEditMode && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Shift <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={String(bulkForm.shiftId || '')}
                  onValueChange={(v) => handleBulkShiftChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((s: any) => (
                      <SelectItem key={s.shift?.shiftId} value={String(s.shift?.shiftId)}>
                        {s.shift?.shiftName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Recurrence</Label>
                <Select
                  value={bulkRecurrenceType ?? 'none'}
                  onValueChange={handleBulkRecurrenceChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Effective From <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={bulkForm.effectiveFrom}
                    onChange={(e) => handleBulkDateChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Effective To
                    {bulkRecurrenceType && (
                      <span className="ml-2 text-xs text-green-600 font-normal">
                        auto-filled
                      </span>
                    )}
                  </Label>
                  <Input
                    type="date"
                    value={bulkForm.effectiveTo ?? ''}
                    onChange={(e) => handleBulkChange('effectiveTo', e.target.value)}
                    readOnly={!!bulkRecurrenceType}
                    className={
                      bulkRecurrenceType ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input
                  placeholder="Optional remarks"
                  value={bulkForm.remarks ?? ''}
                  onChange={(e) => handleBulkChange('remarks', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Select Employees{' '}
                  <span className="text-gray-400 text-xs">
                    ({bulkForm.employeeIds.length} selected)
                  </span>
                </Label>
                <div className="border rounded-md p-2 max-h-52 overflow-y-auto space-y-1">
                  {employees.map((emp: any) => {
                    const checked = bulkForm.employeeIds.includes(emp.employeeId)
                    return (
                      <label
                        key={emp.employeeId}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                          checked ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleBulkEmployee(emp.employeeId)}
                          className="accent-blue-500"
                        />
                        <span>
                          {emp.empFullName}{' '}
                          <span className="text-gray-400">({emp.empCode})</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closePopup}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Popup>

      {/* ── Recurrence Settings Popup ── */}
      <Popup
        isOpen={isRecurrencePopupOpen}
        onClose={closeRecurrencePopup}
        title="Recurrence Settings"
        size="sm:max-w-sm"
      >
        <form onSubmit={handleRecurrenceSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label>Recurrence Type</Label>
            <Select
              value={recurrenceForm.recurrenceType ?? 'none'}
              onValueChange={(v) =>
                setRecurrenceForm((prev) => ({
                  ...prev,
                  recurrenceType: v === 'none' ? null : (v as 'weekly' | 'monthly'),
                  recurrenceActive: v !== 'none' ? prev.recurrenceActive : false,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recurrenceForm.recurrenceType && (
            <div className="flex items-center justify-between rounded-lg border p-3 bg-gray-50">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-gray-500">
                  Enable automatic copy for this allocation
                </p>
              </div>
              <input
                type="checkbox"
                checked={recurrenceForm.recurrenceActive}
                onChange={(e) =>
                  setRecurrenceForm((prev) => ({
                    ...prev,
                    recurrenceActive: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-blue-500 cursor-pointer"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={closeRecurrencePopup}>
              Cancel
            </Button>
            <Button type="submit" disabled={recurrenceMutation.isPending}>
              {recurrenceMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Popup>

      {/* ── Copy All Popup ── */}
      <Popup
        isOpen={isCopyAllPopupOpen}
        onClose={() => setIsCopyAllPopupOpen(false)}
        title="Copy All Active Allocations"
        size="sm:max-w-sm"
      >
        <div className="space-y-5 py-4">
          <p className="text-sm text-gray-600">
            This will copy all active allocations of the selected recurrence type to the next
            period.
          </p>
          <div className="space-y-2">
            <Label>Recurrence Type</Label>
            <Select
              value={copyAllType}
              onValueChange={(v) => setCopyAllType(v as 'weekly' | 'monthly')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCopyAllPopupOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={copyAllMutation.isPending}
              onClick={() => {
                copyAllMutation.mutate(
                  { recurrenceType: copyAllType, createdBy: userData?.userId || 0 },
                  { onSuccess: () => setIsCopyAllPopupOpen(false) }
                )
              }}
            >
              {copyAllMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CopyCheck className="h-4 w-4 mr-1" />
              )}
              {copyAllMutation.isPending ? 'Copying...' : 'Copy All'}
            </Button>
          </div>
        </div>
      </Popup>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift Allocation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this shift allocation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) deleteMutation.mutate({ id: deletingId })
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

export default ShiftAllocationPage