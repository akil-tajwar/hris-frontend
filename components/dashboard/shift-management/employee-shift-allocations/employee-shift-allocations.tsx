'use client'

import type React from 'react'
import { Fragment, useCallback, useEffect, useState, useMemo } from 'react'
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
  CopyCheck,
  Settings2,
  RefreshCw,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import { CustomCombobox } from '@/utils/custom-combobox'
import type {
  CreateShiftAllocationType,
  GetShiftAllocationType,
  GetEmployeeType,
  GetDepartmentType,
  UpdateRecurrenceType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetShiftAllocations,
  useAddShiftAllocation,
  useUpdateShiftAllocation,
  useDeleteShiftAllocation,
  useUpdateShiftAllocationRecurrence,
  useGetAllEmployees,
  useGetShiftDayAndWeekDays,
  // ⚠️ Adjust this hook name if your project exports it differently.
  useGetDepartments,
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

// ─── Local (non-domain) helper types ───────────────────────────────
// GetShiftAllocationType (from type.ts) didn't show departmentId/departmentName
// in what you shared, but you mentioned the GET api now returns them.
// This intersection just widens the field for this file — if type.ts already
// has these two fields, this is a harmless no-op and can be removed.
type AllocationRow = GetShiftAllocationType & {
  departmentId?: number | null
  departmentName?: string | null
}

type SortColumn =
  | 'employee'
  | 'shift'
  | 'effectiveFrom'
  | 'effectiveTo'
  | 'recurrence'
  | 'remarks'

// Structural shape CustomCombobox expects — not a domain type.
type ComboItem = { id: string; name: string }

// Bulk create doesn't need its own domain type: it's just N copies of
// CreateShiftAllocationType (one per employee) built right before submit.
type BulkFormState = Omit<Partial<CreateShiftAllocationType>, 'employeeId'> & {
  employeeIds: number[]
}

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

const getWorkingDaysFromShift = (shiftEntry: any): number[] => {
  const days: any[] =
    shiftEntry?.shiftDayConfigs ??
    shiftEntry?.weekDays ??
    shiftEntry?.days ??
    []
  return days
    .filter(
      (d: any) =>
        d.dayType !== 'Weekend' && (d.weekDay ?? d.day ?? d.weekDay?.day)
    )
    .map((d: any) => DAY_ORDER[d.weekDay ?? d.day ?? d.weekDay?.day] ?? -1)
    .filter((n: number) => n >= 0)
    .sort((a: number, b: number) => a - b)
}

const calcWeekRangeFromShift = (fromDate: string, workingDays: number[]) => {
  const { year, month, day } = parseLocalDate(fromDate)
  const weekStartDay = workingDays.length > 0 ? workingDays[0] : 1
  const weekEndDay =
    workingDays.length > 0 ? workingDays[workingDays.length - 1] : 0

  const date = new Date(year, month, day)
  const currentDow = date.getDay()

  let diff = weekStartDay - currentDow
  if (diff > 0) diff -= 7

  const start = new Date(year, month, day + diff)

  const weekLength =
    weekEndDay >= weekStartDay
      ? weekEndDay - weekStartDay
      : 7 - weekStartDay + weekEndDay

  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + weekLength
  )

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

// Given an existing allocation's range + its recurrence type, compute the
// NEXT period's range for a "copy" action.
// monthly: 1 Jun–30 Jun  -> 1 Jul–31 Jul (next full calendar month)
// weekly:  shift both dates forward by 7 days
const getNextPeriodRange = (
  effectiveFrom: string,
  effectiveTo: string,
  recurrenceType: 'weekly' | 'monthly'
) => {
  if (recurrenceType === 'monthly') {
    const { year, month } = parseLocalDate(effectiveFrom)
    let newMonthIndex = month + 1
    let newYear = year
    if (newMonthIndex > 11) {
      newMonthIndex = 0
      newYear += 1
    }
    const lastDay = new Date(newYear, newMonthIndex + 1, 0).getDate()
    return {
      effectiveFrom: `${newYear}-${padTwo(newMonthIndex + 1)}-01`,
      effectiveTo: `${newYear}-${padTwo(newMonthIndex + 1)}-${padTwo(lastDay)}`,
    }
  }
  // weekly
  const from = parseLocalDate(effectiveFrom)
  const to = parseLocalDate(effectiveTo || effectiveFrom)
  const newFrom = new Date(from.year, from.month, from.day + 7)
  const newTo = new Date(to.year, to.month, to.day + 7)
  return { effectiveFrom: fmtDate(newFrom), effectiveTo: fmtDate(newTo) }
}

// ─── Label helpers ─────────────────────────────────────────────────
const buildEmployeeLabel = (emp: GetEmployeeType) =>
  `${emp.empCode}-${emp.empFullName}-${emp.departmentName}`

const buildShiftLabel = (s: any) => s?.shift?.shiftName ?? ''

// ─── Default form states ──────────────────────────────────────────
const defaultSingleForm = (
  userId: number
): Partial<CreateShiftAllocationType> => ({
  employeeId: 0,
  shiftId: 0,
  effectiveFrom: '',
  effectiveTo: '',
  remarks: '',
  approvedBy: undefined,
  createdBy: userId,
  recurrenceType: undefined,
  recurrenceActive: undefined,
})

const defaultBulkForm = (userId: number): BulkFormState => ({
  employeeIds: [],
  shiftId: 0,
  effectiveFrom: '',
  effectiveTo: '',
  remarks: '',
  approvedBy: undefined,
  createdBy: userId,
  recurrenceType: undefined,
  recurrenceActive: undefined,
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
  const { data: departmentsData } = useGetDepartments()

  const employees: GetEmployeeType[] = useMemo(
    () => employeesData?.data ?? [],
    [employeesData]
  )
  const shifts = useMemo(() => shiftsData?.data ?? [], [shiftsData])
  const departments: GetDepartmentType[] = useMemo(
    () => departmentsData?.data ?? [],
    [departmentsData]
  )

  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<SortColumn>('employee')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [showLatestOnly, setShowLatestOnly] = useState(true)

  // Popup states
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [allocMode, setAllocMode] = useState<'single' | 'bulk'>('single')

  // Recurrence popup
  const [isRecurrencePopupOpen, setIsRecurrencePopupOpen] = useState(false)
  const [recurrenceTargetId, setRecurrenceTargetId] = useState<number | null>(
    null
  )
  const [recurrenceForm, setRecurrenceForm] = useState<UpdateRecurrenceType>(
    defaultRecurrenceForm()
  )

  // Copy All popup
  const [isCopyAllPopupOpen, setIsCopyAllPopupOpen] = useState(false)
  const [bulkDepartmentId, setBulkDepartmentId] = useState<number | null>(null)
  const [copyRecurrenceType, setCopyRecurrenceType] = useState<
    'weekly' | 'monthly'
  >('monthly')
  const [copyFromDate, setCopyFromDate] = useState('')
  const [copyToDate, setCopyToDate] = useState('')
  const [selectedCopyIds, setSelectedCopyIds] = useState<Set<number>>(new Set())

  // Delete
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [singleForm, setSingleForm] = useState<
    Partial<CreateShiftAllocationType>
  >(defaultSingleForm(userData?.userId || 0))
  const [bulkForm, setBulkForm] = useState<BulkFormState>(
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
    setBulkDepartmentId(null)
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

  const closeCopyAllPopup = useCallback(() => {
    setIsCopyAllPopupOpen(false)
    setCopyRecurrenceType('monthly')
    setCopyFromDate('')
    setCopyToDate('')
    setSelectedCopyIds(new Set())
  }, [])

  // ─── Mutations ──────────────────────────────────────────────────
  // Single create + bulk create both go through this one hook, sent as an
  // array of CreateShiftAllocationType. Copy uses a second instance so it
  // can have its own close/reset tied to the copy popup instead of the
  // add/edit popup.
  const createMutation = useAddShiftAllocation({
    onClose: closePopup,
    reset: resetForm,
  })
  const copyCreateMutation = useAddShiftAllocation({
    onClose: closeCopyAllPopup,
    reset: () => setSelectedCopyIds(new Set()),
  })
  const updateMutation = useUpdateShiftAllocation({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteShiftAllocation({
    onClose: () => setIsDeleteDialogOpen(false),
    reset: () => setDeletingId(null),
  })
  const recurrenceMutation = useUpdateShiftAllocationRecurrence({
    onClose: closeRecurrencePopup,
    reset: () => setRecurrenceForm(defaultRecurrenceForm()),
  })

  // ─── Helpers ──────────────────────────────────────────────────
  const getShiftWorkingDays = useCallback(
    (shiftId: number): number[] => {
      const entry = shifts.find((s: any) => s.shift?.shiftId === shiftId)
      return entry ? getWorkingDaysFromShift(entry) : []
    },
    [shifts]
  )

  const autoFillDates = useCallback(
    (
      effectiveFrom: string,
      recurrenceType: 'weekly' | 'monthly' | undefined,
      shiftId: number
    ): { effectiveFrom: string; effectiveTo: string } | null => {
      if (!effectiveFrom || !recurrenceType) return null
      if (recurrenceType === 'monthly') {
        return calcMonthRange(effectiveFrom)
      }
      const workingDays = getShiftWorkingDays(shiftId)
      return calcWeekRangeFromShift(effectiveFrom, workingDays)
    },
    [getShiftWorkingDays]
  )

  // ─── "Latest per employee" lookup (based on effectiveFrom, then effectiveTo) ──
  const latestAllocationIds = useMemo(() => {
    const rows: AllocationRow[] = allocations?.data ?? []
    const latestByEmployee = new Map<number, AllocationRow>()
    for (const row of rows) {
      const existing = latestByEmployee.get(row.employeeId)
      if (!existing) {
        latestByEmployee.set(row.employeeId, row)
        continue
      }
      const rowFrom = row.effectiveFrom ?? ''
      const existingFrom = existing.effectiveFrom ?? ''
      if (rowFrom > existingFrom) {
        latestByEmployee.set(row.employeeId, row)
      } else if (rowFrom === existingFrom) {
        // no end date (ongoing) counts as the latest
        const rowTo = row.effectiveTo ?? '9999-12-31'
        const existingTo = existing.effectiveTo ?? '9999-12-31'
        if (rowTo >= existingTo) latestByEmployee.set(row.employeeId, row)
      }
    }
    return new Set(Array.from(latestByEmployee.values()).map((r) => r.id))
  }, [allocations?.data])

  // ─── Table filtering / sorting / grouping ──────────────────────
  const filtered = useMemo(() => {
    const rows: AllocationRow[] = allocations?.data ?? []
    return rows.filter((a) => {
      const matchesSearch =
        a.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.shiftName?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLatest = !showLatestOnly || latestAllocationIds.has(a.id)
      return matchesSearch && matchesLatest
    })
  }, [allocations?.data, searchTerm, showLatestOnly, latestAllocationIds])

  const compareByColumn = useCallback(
    (a: AllocationRow, b: AllocationRow, column: SortColumn) => {
      let av = ''
      let bv = ''
      switch (column) {
        case 'employee':
          av = a.employeeName ?? ''
          bv = b.employeeName ?? ''
          break
        case 'shift':
          av = a.shiftName ?? ''
          bv = b.shiftName ?? ''
          break
        case 'effectiveFrom':
          av = a.effectiveFrom ?? ''
          bv = b.effectiveFrom ?? ''
          break
        case 'effectiveTo':
          av = a.effectiveTo ?? ''
          bv = b.effectiveTo ?? ''
          break
        case 'recurrence':
          av = a.recurrenceType ?? ''
          bv = b.recurrenceType ?? ''
          break
        case 'remarks':
          av = a.remarks ?? ''
          bv = b.remarks ?? ''
          break
      }
      return av.localeCompare(bv)
    },
    []
  )

  // Grouped by shift (primary), then sorted by the chosen column (secondary) within each group.
  const sorted = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const shiftCompare = (a.shiftName ?? '').localeCompare(b.shiftName ?? '')
      if (shiftCompare !== 0) return shiftCompare
      return compareByColumn(a, b, sortColumn) * dir
    })
  }, [filtered, sortColumn, sortDirection, compareByColumn])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * perPage
    return sorted.slice(start, start + perPage)
  }, [sorted, currentPage, perPage])

  const totalPages = Math.ceil(sorted.length / perPage)

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // ─── Single form handlers ──────────────────────────────────────
  const handleSingleChange = (
    name: keyof CreateShiftAllocationType,
    value: any
  ) => setSingleForm((prev) => ({ ...prev, [name]: value }))

  const handleSingleShiftChange = (shiftId: number) => {
    setSingleForm((prev) => {
      const updated = { ...prev, shiftId }
      if (prev.effectiveFrom && prev.recurrenceType) {
        const range = autoFillDates(
          prev.effectiveFrom,
          prev.recurrenceType,
          shiftId
        )
        if (range) Object.assign(updated, range)
      }
      return updated
    })
  }

  const handleSingleRecurrenceChange = (
    recurrenceType: 'weekly' | 'monthly'
  ) => {
    setSingleForm((prev) => {
      const updated = { ...prev, recurrenceType }
      if (prev.effectiveFrom) {
        const range = autoFillDates(
          prev.effectiveFrom,
          recurrenceType,
          prev.shiftId ?? 0
        )
        if (range) Object.assign(updated, range)
      }
      return updated
    })
  }

  const handleSingleDateChange = (value: string) => {
    setSingleForm((prev) => {
      const updated = { ...prev, effectiveFrom: value }
      if (prev.recurrenceType) {
        const range = autoFillDates(
          value,
          prev.recurrenceType,
          prev.shiftId ?? 0
        )
        if (range) Object.assign(updated, range)
      }
      return updated
    })
  }

  // ─── Bulk form handlers ────────────────────────────────────────
  const handleBulkChange = (name: keyof BulkFormState, value: any) =>
    setBulkForm((prev) => ({ ...prev, [name]: value }))

  const handleBulkShiftChange = (shiftId: number) => {
    setBulkForm((prev) => {
      const updated = { ...prev, shiftId }
      if (prev.effectiveFrom && prev.recurrenceType) {
        const range = autoFillDates(
          prev.effectiveFrom,
          prev.recurrenceType,
          shiftId
        )
        if (range) Object.assign(updated, range)
      }
      return updated
    })
  }

  const handleBulkRecurrenceChange = (recurrenceType: 'weekly' | 'monthly') => {
    setBulkForm((prev) => {
      const updated = { ...prev, recurrenceType }
      if (prev.effectiveFrom) {
        const range = autoFillDates(
          prev.effectiveFrom,
          recurrenceType,
          prev.shiftId ?? 0
        )
        if (range) Object.assign(updated, range)
      }
      return updated
    })
  }

  const handleBulkDateChange = (value: string) => {
    setBulkForm((prev) => {
      const updated = { ...prev, effectiveFrom: value }
      if (prev.recurrenceType) {
        const range = autoFillDates(
          value,
          prev.recurrenceType,
          prev.shiftId ?? 0
        )
        if (range) Object.assign(updated, range)
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

  // Employees shown in the bulk popup — filtered by department when one is picked there.
  const bulkVisibleEmployees = useMemo(
    () =>
      bulkDepartmentId == null
        ? employees
        : employees.filter((e) => e.departmentId === bulkDepartmentId),
    [employees, bulkDepartmentId]
  )

  const visibleEmployeeIds = useMemo(
    () =>
      bulkVisibleEmployees.map((e) => e.employeeId!).filter((id) => id != null),
    [bulkVisibleEmployees]
  )
  const allEmployeesSelected =
    visibleEmployeeIds.length > 0 &&
    visibleEmployeeIds.every((id) => bulkForm.employeeIds.includes(id))

  // "Select all" only affects the currently visible (department-filtered) employees —
  // it adds them all in, or removes just them, without touching selections from
  // outside the current department filter.
  const toggleSelectAllEmployees = () => {
    setBulkForm((prev) => {
      if (allEmployeesSelected) {
        return {
          ...prev,
          employeeIds: prev.employeeIds.filter(
            (id) => !visibleEmployeeIds.includes(id)
          ),
        }
      }
      const merged = new Set([...prev.employeeIds, ...visibleEmployeeIds])
      return { ...prev, employeeIds: Array.from(merged) }
    })
  }

  const handleEditClick = (alloc: AllocationRow) => {
    setSingleForm({
      employeeId: alloc.employeeId,
      shiftId: alloc.shiftId,
      effectiveFrom: alloc.effectiveFrom?.slice(0, 10) ?? '',
      effectiveTo: alloc.effectiveTo?.slice(0, 10) ?? '',
      remarks: alloc.remarks ?? '',
      approvedBy: alloc.approvedBy ?? undefined,
      createdBy: userData?.userId || 0,
      recurrenceType: undefined,
      recurrenceActive: undefined,
    })
    setEditingId(alloc.id)
    setIsEditMode(true)
    setAllocMode('single')
    setIsPopupOpen(true)
  }

  const handleRecurrenceClick = (alloc: AllocationRow) => {
    setRecurrenceTargetId(alloc.id)
    setRecurrenceForm({
      recurrenceType: alloc.recurrenceType ?? null,
      recurrenceActive: Boolean(alloc.recurrenceActive),
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
        if (!singleForm.recurrenceType) {
          alert('Recurrence type is required.')
          return
        }
        const payload: CreateShiftAllocationType = {
          employeeId: singleForm.employeeId!,
          shiftId: singleForm.shiftId!,
          effectiveFrom: singleForm.effectiveFrom!,
          effectiveTo: singleForm.effectiveTo || undefined,
          remarks: singleForm.remarks || undefined,
          approvedBy: singleForm.approvedBy,
          createdBy: singleForm.createdBy!,
          recurrenceType: singleForm.recurrenceType,
          recurrenceActive: true,
        }
        createMutation.mutate([payload])
      } else {
        if (!bulkForm.recurrenceType) {
          alert('Recurrence type is required.')
          return
        }
        if (bulkForm.employeeIds.length === 0) {
          alert('Select at least one employee.')
          return
        }
        const payloads: CreateShiftAllocationType[] = bulkForm.employeeIds.map(
          (employeeId) => ({
            employeeId,
            shiftId: bulkForm.shiftId!,
            effectiveFrom: bulkForm.effectiveFrom!,
            effectiveTo: bulkForm.effectiveTo || undefined,
            remarks: bulkForm.remarks || undefined,
            approvedBy: bulkForm.approvedBy,
            createdBy: bulkForm.createdBy!,
            recurrenceType: bulkForm.recurrenceType!,
            recurrenceActive: true,
          })
        )
        createMutation.mutate(payloads)
      }
    },
    [
      isEditMode,
      editingId,
      allocMode,
      singleForm,
      bulkForm,
      updateMutation,
      createMutation,
    ]
  )

  const handleRecurrenceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!recurrenceTargetId) return
    recurrenceMutation.mutate({ id: recurrenceTargetId, data: recurrenceForm })
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  // ─── Copy All logic ─────────────────────────────────────────────
  const copyMatches: AllocationRow[] = useMemo(() => {
    const rows: AllocationRow[] = allocations?.data ?? []
    if (!copyFromDate || !copyToDate) return []
    return rows.filter((a) => {
      const from = a.effectiveFrom?.slice(0, 10) ?? ''
      return (
        a.recurrenceType === copyRecurrenceType &&
        Boolean(a.recurrenceActive) &&
        from >= copyFromDate &&
        from <= copyToDate
      )
    })
  }, [allocations?.data, copyRecurrenceType, copyFromDate, copyToDate])

  // Reset the checkbox selection whenever the filter criteria change.
  useEffect(() => {
    setSelectedCopyIds(new Set())
  }, [copyRecurrenceType, copyFromDate, copyToDate])

  const copyAllSelected =
    copyMatches.length > 0 && selectedCopyIds.size === copyMatches.length

  const toggleCopySelectAll = () => {
    setSelectedCopyIds(
      copyAllSelected ? new Set() : new Set(copyMatches.map((a) => a.id))
    )
  }

  const toggleCopyOne = (id: number) => {
    setSelectedCopyIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCopySubmit = () => {
    const selectedRows = copyMatches.filter((a) => selectedCopyIds.has(a.id))
    if (selectedRows.length === 0) return

    const payloads: CreateShiftAllocationType[] = selectedRows.map((a) => {
      const recurrenceType = (a.recurrenceType ?? copyRecurrenceType) as
        | 'weekly'
        | 'monthly'
      const range = getNextPeriodRange(
        a.effectiveFrom.slice(0, 10),
        (a.effectiveTo ?? a.effectiveFrom).slice(0, 10),
        recurrenceType
      )
      return {
        employeeId: a.employeeId,
        shiftId: a.shiftId,
        effectiveFrom: range.effectiveFrom,
        effectiveTo: range.effectiveTo,
        remarks: a.remarks ?? undefined,
        approvedBy: a.approvedBy ?? undefined,
        createdBy: userData?.userId || 0,
        recurrenceType,
        recurrenceActive: true,
      }
    })

    copyCreateMutation.mutate(payloads)
  }

  // ─── Combobox item builders ─────────────────────────────────────
  const employeeItems: ComboItem[] = useMemo(
    () =>
      employees.map((emp) => ({
        id: String(emp.employeeId),
        name: buildEmployeeLabel(emp),
      })),
    [employees]
  )

  const shiftItems: ComboItem[] = useMemo(
    () =>
      shifts.map((s: any) => ({
        id: String(s.shift?.shiftId),
        name: buildShiftLabel(s),
      })),
    [shifts]
  )

  const departmentItems: ComboItem[] = useMemo(
    () =>
      departments.map((d) => ({
        id: String(d.departmentId),
        name: d.departmentName,
      })),
    [departments]
  )

  const singleEmployeeValue: ComboItem | null = singleForm.employeeId
    ? {
        id: String(singleForm.employeeId),
        name:
          employeeItems.find((i) => i.id === String(singleForm.employeeId))
            ?.name ?? String(singleForm.employeeId),
      }
    : null

  const singleShiftValue: ComboItem | null = singleForm.shiftId
    ? {
        id: String(singleForm.shiftId),
        name:
          shiftItems.find((i) => i.id === String(singleForm.shiftId))?.name ??
          String(singleForm.shiftId),
      }
    : null

  const bulkShiftValue: ComboItem | null = bulkForm.shiftId
    ? {
        id: String(bulkForm.shiftId),
        name:
          shiftItems.find((i) => i.id === String(bulkForm.shiftId))?.name ??
          String(bulkForm.shiftId),
      }
    : null

  const bulkDepartmentValue: ComboItem | null =
    bulkDepartmentId != null
      ? {
          id: String(bulkDepartmentId),
          name:
            departmentItems.find((i) => i.id === String(bulkDepartmentId))
              ?.name ?? String(bulkDepartmentId),
        }
      : null

  const sortHeader = (label: string, column: SortColumn) => (
    <TableHead
      onClick={() => handleSort(column)}
      className="cursor-pointer select-none"
    >
      {label} <ArrowUpDown className="ml-2 h-4 w-4 inline" />
    </TableHead>
  )

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

      {/* Latest-only toggle */}
      <div className="flex items-center gap-2 -mt-4">
        <input
          type="checkbox"
          id="latest-only"
          checked={showLatestOnly}
          onChange={(e) => setShowLatestOnly(e.target.checked)}
          className="accent-blue-500 w-4 h-4 cursor-pointer"
        />
        <Label htmlFor="latest-only" className="cursor-pointer text-sm">
          Show only latest shifts of employees
        </Label>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              {sortHeader('Employee', 'employee')}
              {sortHeader('Shift', 'shift')}
              {sortHeader('Effective From', 'effectiveFrom')}
              {sortHeader('Effective To', 'effectiveTo')}
              {sortHeader('Recurrence', 'recurrence')}
              {sortHeader('Remarks', 'remarks')}
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
              paginated.map((alloc: AllocationRow, index: number) => {
                const showGroupHeader =
                  index === 0 ||
                  paginated[index - 1].shiftName !== alloc.shiftName
                return (
                  <Fragment key={alloc.id}>
                    {showGroupHeader && (
                      <TableRow className="bg-gray-100 hover:bg-gray-100">
                        <TableCell
                          colSpan={8}
                          className="font-semibold text-sm py-2"
                        >
                          {alloc.shiftName ?? 'Unknown Shift'}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell>
                        {(currentPage - 1) * perPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {alloc.employeeName ?? '—'}
                      </TableCell>
                      <TableCell>{alloc.shiftName ?? '—'}</TableCell>
                      <TableCell>{alloc.effectiveFrom?.slice(0, 10)}</TableCell>
                      <TableCell>
                        {alloc.effectiveTo?.slice(0, 10) ?? (
                          <span className="text-gray-400 text-xs">
                            No end date
                          </span>
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
                              {alloc.recurrenceType === 'weekly'
                                ? 'Weekly'
                                : 'Monthly'}
                            </Badge>
                            {Boolean(alloc.recurrenceActive) && (
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
                        {alloc.remarks ?? (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
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
                  </Fragment>
                )
              })
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className={
                    currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                  }
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
                } else if (
                  index === currentPage - 3 ||
                  index === currentPage + 3
                ) {
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
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
                  <CustomCombobox
                    items={employeeItems}
                    value={singleEmployeeValue}
                    onChange={(v: ComboItem | null) =>
                      handleSingleChange('employeeId', v ? Number(v.id) : 0)
                    }
                    placeholder="Select employee"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  Shift <span className="text-red-500">*</span>
                </Label>
                <CustomCombobox
                  items={shiftItems}
                  value={singleShiftValue}
                  onChange={(v: ComboItem | null) => {
                    const shiftId = v ? Number(v.id) : 0
                    if (isEditMode) handleSingleChange('shiftId', shiftId)
                    else handleSingleShiftChange(shiftId)
                  }}
                  placeholder="Select shift"
                />
              </div>

              {/* Recurrence — mandatory, only on create */}
              {!isEditMode && (
                <div className="space-y-2">
                  <Label>
                    Recurrence <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={singleForm.recurrenceType ?? ''}
                    onValueChange={(v) =>
                      handleSingleRecurrenceChange(v as 'weekly' | 'monthly')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                    <SelectContent>
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
                    {!isEditMode && singleForm.recurrenceType && (
                      <span className="ml-2 text-xs text-green-600 font-normal">
                        auto-filled
                      </span>
                    )}
                  </Label>
                  <Input
                    type="date"
                    value={singleForm.effectiveTo ?? ''}
                    onChange={(e) =>
                      handleSingleChange('effectiveTo', e.target.value)
                    }
                    readOnly={!isEditMode && !!singleForm.recurrenceType}
                    className={
                      !isEditMode && singleForm.recurrenceType
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
                  onChange={(e) =>
                    handleSingleChange('remarks', e.target.value)
                  }
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
                <CustomCombobox
                  items={shiftItems}
                  value={bulkShiftValue}
                  onChange={(v: ComboItem | null) =>
                    handleBulkShiftChange(v ? Number(v.id) : 0)
                  }
                  placeholder="Select shift"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Recurrence <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={bulkForm.recurrenceType ?? ''}
                  onValueChange={(v) =>
                    handleBulkRecurrenceChange(v as 'weekly' | 'monthly')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                  <SelectContent>
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
                    {bulkForm.recurrenceType && (
                      <span className="ml-2 text-xs text-green-600 font-normal">
                        auto-filled
                      </span>
                    )}
                  </Label>
                  <Input
                    type="date"
                    value={bulkForm.effectiveTo ?? ''}
                    onChange={(e) =>
                      handleBulkChange('effectiveTo', e.target.value)
                    }
                    readOnly={!!bulkForm.recurrenceType}
                    className={
                      bulkForm.recurrenceType
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
                  value={bulkForm.remarks ?? ''}
                  onChange={(e) => handleBulkChange('remarks', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>
                    Select Employees{' '}
                    <span className="text-gray-400 text-xs">
                      ({bulkForm.employeeIds.length} selected)
                    </span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="w-48">
                      <CustomCombobox
                        items={departmentItems}
                        value={bulkDepartmentValue}
                        onChange={(v: ComboItem | null) =>
                          setBulkDepartmentId(v ? Number(v.id) : null)
                        }
                        placeholder="Filter by department"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={allEmployeesSelected}
                        onChange={toggleSelectAllEmployees}
                        className="accent-blue-500"
                      />
                      Select all
                    </label>
                  </div>
                </div>
                <div className="border rounded-md p-2 max-h-52 overflow-y-auto space-y-1">
                  {bulkVisibleEmployees.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No employees in this department
                    </p>
                  ) : (
                    bulkVisibleEmployees.map((emp) => {
                      const checked = bulkForm.employeeIds.includes(
                        emp.employeeId!
                      )
                      return (
                        <label
                          key={emp.employeeId}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                            checked
                              ? 'bg-blue-50 text-blue-700'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleBulkEmployee(emp.employeeId!)}
                            className="accent-blue-500"
                          />
                          <span>{buildEmployeeLabel(emp)}</span>
                        </label>
                      )
                    })
                  )}
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
                  recurrenceType:
                    v === 'none' ? null : (v as 'weekly' | 'monthly'),
                  recurrenceActive:
                    v !== 'none' ? prev.recurrenceActive : false,
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
            <Button
              type="button"
              variant="outline"
              onClick={closeRecurrencePopup}
            >
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
        onClose={closeCopyAllPopup}
        title="Copy All Active Allocations"
        size="sm:max-w-2xl"
      >
        <div className="space-y-5 py-4">
          <p className="text-sm text-gray-600">
            Pick a recurrence type and a date range, then choose which matching
            allocations to copy into their next period.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Recurrence Type</Label>
              <Select
                value={copyRecurrenceType}
                onValueChange={(v) =>
                  setCopyRecurrenceType(v as 'weekly' | 'monthly')
                }
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
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={copyFromDate}
                onChange={(e) => setCopyFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={copyToDate}
                onChange={(e) => setCopyToDate(e.target.value)}
              />
            </div>
          </div>

          {copyFromDate && copyToDate && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Matching Allocations{' '}
                  <span className="text-gray-400 text-xs">
                    ({selectedCopyIds.size} of {copyMatches.length} selected)
                  </span>
                </Label>
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyAllSelected}
                    onChange={toggleCopySelectAll}
                    className="accent-blue-500"
                    disabled={copyMatches.length === 0}
                  />
                  Select all
                </label>
              </div>
              <div className="border rounded-md max-h-72 overflow-y-auto">
                {copyMatches.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No matching allocations found
                  </p>
                ) : (
                  copyMatches.map((a) => {
                    const checked = selectedCopyIds.has(a.id)
                    return (
                      <label
                        key={a.id}
                        className={`flex items-center gap-3 px-3 py-2 border-b last:border-b-0 cursor-pointer text-sm transition-colors ${
                          checked ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCopyOne(a.id)}
                          className="accent-blue-500"
                        />
                        <span className="flex-1">
                          <span className="font-medium">{a.employeeName}</span>{' '}
                          — {a.shiftName} ({a.effectiveFrom?.slice(0, 10)} to{' '}
                          {a.effectiveTo?.slice(0, 10) ?? 'ongoing'})
                        </span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={closeCopyAllPopup}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={
                copyCreateMutation.isPending || selectedCopyIds.size === 0
              }
              onClick={handleCopySubmit}
            >
              {copyCreateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CopyCheck className="h-4 w-4 mr-1" />
              )}
              {copyCreateMutation.isPending
                ? 'Copying...'
                : `Copy Selected (${selectedCopyIds.size})`}
            </Button>
          </div>
        </div>
      </Popup>

      {/* ── Delete Dialog ── */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift Allocation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this shift allocation? This action
              cannot be undone.
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
