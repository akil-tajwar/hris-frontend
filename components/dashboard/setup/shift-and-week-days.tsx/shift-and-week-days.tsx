'use client'

import type React from 'react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  ArrowUpDown,
  Search,
  Clock,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateShiftType, GetShiftsType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddShiftDayAndWeekDays,
  useDeleteShiftDayAndWeekDays,
  useGetShiftDayAndWeekDays,
  useUpdateShiftDayAndWeekDays,
  useGetWeekDays,
  useGetCompanies,
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
import { formatTime } from '@/utils/conversions'
import { CustomCombobox } from '@/utils/custom-combobox'
import CustomSwitch from '@/utils/custom-switch'

// Day type options matching the schema enum
const DAY_TYPE_OPTIONS = ['FullDay', 'HalfDay', 'Weekend'] as const
type DayType = (typeof DAY_TYPE_OPTIONS)[number]

// Shift type options matching the schema enum
const SHIFT_TYPE_OPTIONS = ['Fixed', 'Flexible', 'Rotational'] as const
type ShiftType = (typeof SHIFT_TYPE_OPTIONS)[number]

const defaultShift: CreateShiftType['shift'] = {
  companyId: 0,
  shiftName: '',
  shiftCode: '',
  shiftType: 'Fixed',
  startTime: '09:00',
  endTime: '17:00',
  breakMinutes: 0,
  expectedWorkHours: 8,
  crossDay: false,
  isFlexible: false,
  flexibleInFrom: null,
  flexibleInTo: null,
  minimumHoursForPresent: 4,
  status: true,
  createdBy: 0,
}

const defaultFormData: CreateShiftType = {
  shift: defaultShift,
  shiftDayAndWeekDays: [],
}

const ShiftAndWeekDays = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: shift } = useGetShiftDayAndWeekDays()
  const { data: weekDays } = useGetWeekDays()
  const { data: companies } = useGetCompanies()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [timingsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetShiftsType['shift']>('startTime')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingTimingId, setEditingTimingId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingTimingId, setDeletingTimingId] = useState<number | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRowExpand = (shiftId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      next.has(shiftId) ? next.delete(shiftId) : next.add(shiftId)
      return next
    })
  }

  const [formData, setFormData] = useState<CreateShiftType>(defaultFormData)

  // ─── Shift field helpers ──────────────────────────────────────────────────

  const handleShiftChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      shift: { ...prev.shift, [name]: value },
    }))
  }

  const handleShiftNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof CreateShiftType['shift']
  ) => {
    const value = parseFloat(e.target.value)
    setFormData((prev) => ({
      ...prev,
      shift: { ...prev.shift, [field]: isNaN(value) ? 0 : value },
    }))
  }

  const handleShiftSelectChange = (
    field: keyof CreateShiftType['shift'],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      shift: { ...prev.shift, [field]: value },
    }))
  }

  const handleShiftSwitchChange = (
    field: keyof CreateShiftType['shift'],
    value: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      shift: { ...prev.shift, [field]: value },
    }))
  }

  // ─── ShiftDayAndWeekDays helpers ─────────────────────────────────────────

  const computeDayValues = (
    dayType: DayType,
    shiftData: CreateShiftType['shift']
  ) => {
    if (dayType === 'Weekend') {
      return {
        startTime: null,
        endTime: null,
        breakMinutes: undefined,
        expectedWorkHours: undefined,
        minimumHoursForPresent: undefined,
      }
    }
    if (dayType === 'HalfDay') {
      return {
        startTime: shiftData.startTime ?? null,
        endTime: shiftData.endTime ?? null,
        breakMinutes:
          shiftData.breakMinutes != null
            ? Math.round(shiftData.breakMinutes / 2)
            : undefined,
        expectedWorkHours:
          shiftData.expectedWorkHours != null
            ? shiftData.expectedWorkHours / 2
            : undefined,
        minimumHoursForPresent:
          shiftData.minimumHoursForPresent != null
            ? shiftData.minimumHoursForPresent / 2
            : undefined,
      }
    }
    // FullDay
    return {
      startTime: shiftData.startTime ?? null,
      endTime: shiftData.endTime ?? null,
      breakMinutes: shiftData.breakMinutes,
      expectedWorkHours: shiftData.expectedWorkHours,
      minimumHoursForPresent: shiftData.minimumHoursForPresent,
    }
  }

  const handleDayTypeChange = (weekDayId: number, dayType: DayType) => {
    setFormData((prev) => ({
      ...prev,
      shiftDayAndWeekDays: prev.shiftDayAndWeekDays.map((c) =>
        c.weekDayId === weekDayId
          ? { ...c, dayType, ...computeDayValues(dayType, prev.shift) }
          : c
      ),
    }))
  }

  const handleDayConfigFieldChange = (
    weekDayId: number,
    field: keyof CreateShiftType['shiftDayAndWeekDays'][number],
    value: string | number | null | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      shiftDayAndWeekDays: prev.shiftDayAndWeekDays.map((c) =>
        c.weekDayId === weekDayId ? { ...c, [field]: value as any } : c
      ),
    }))
  }

  // ─── Reset / Close ────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormData({
      ...defaultFormData,
      shift: { ...defaultShift, createdBy: userData?.userId || 0 },
    })
    setEditingTimingId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  // ─── Mutations ────────────────────────────────────────────────────────────

  const addMutation = useAddShiftDayAndWeekDays({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateShiftDayAndWeekDays({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteShiftDayAndWeekDays({
    onClose: closePopup,
    reset: resetForm,
  })

  // ─── Sorting / Filtering / Pagination ────────────────────────────────────

  const handleSort = (column: keyof GetShiftsType['shift']) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredTimings = useMemo(() => {
    if (!shift?.data) return []
    const list = Array.isArray(shift.data) ? shift.data : [shift.data]
    return list.filter(
      (item: any) =>
        item.shift?.shiftName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.shift?.shiftCode
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.shift?.startTime
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.shift?.endTime?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [shift?.data, searchTerm])

  const sortedTimings = useMemo(() => {
    return [...filteredTimings].sort((a: any, b: any) => {
      const aValue = a.shift?.[sortColumn] ?? ''
      const bValue = b.shift?.[sortColumn] ?? ''
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      return 0
    })
  }, [filteredTimings, sortColumn, sortDirection])

  const paginatedTimings = useMemo(() => {
    const startIndex = (currentPage - 1) * timingsPerPage
    return sortedTimings.slice(startIndex, startIndex + timingsPerPage)
  }, [sortedTimings, currentPage, timingsPerPage])

  const totalPages = Math.ceil(sortedTimings.length / timingsPerPage)

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!formData.shift.companyId) {
        setError('Please select a company')
        return
      }
      if (!formData.shift.shiftName.trim()) {
        setError('Shift name is required')
        return
      }
      if (!formData.shift.shiftCode.trim()) {
        setError('Shift code is required')
        return
      }
      if (formData.shiftDayAndWeekDays.length === 0) {
        setError('Please select at least one weekday')
        return
      }

      try {
        if (isEditMode && editingTimingId) {
          const updateData: CreateShiftType = {
            shift: {
              ...formData.shift,
              updatedBy: userData?.userId || 0,
              createdBy: undefined,
            },
            shiftDayAndWeekDays: formData.shiftDayAndWeekDays,
          }
          updateMutation.mutate({ id: editingTimingId, data: updateData })
        } else {
          const createData: CreateShiftType = {
            shift: {
              ...formData.shift,
              createdBy: userData?.userId || 0,
            },
            shiftDayAndWeekDays: formData.shiftDayAndWeekDays,
          }
          addMutation.mutate(createData)
        }
      } catch (err) {
        setError('Failed to save shift')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingTimingId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving shift')
    }
  }, [addMutation.error, updateMutation.error])

  // ─── Init all 7 days when popup opens (create mode) ─────────────────────

  useEffect(() => {
    if (
      weekDays?.data &&
      !isEditMode &&
      isPopupOpen &&
      formData.shiftDayAndWeekDays.length === 0
    ) {
      const weekendDays = ['friday', 'saturday']
      const allDayConfigs = weekDays.data.map((w: any) => {
        const isWeekend = weekendDays.includes(w.day?.toLowerCase())
        const dayType: DayType = isWeekend ? 'Weekend' : 'FullDay'
        return {
          weekDayId: w.weekDayId,
          weekDay: w.day,
          dayType,
          startTime: isWeekend ? null : (formData.shift.startTime ?? null),
          endTime: isWeekend ? null : (formData.shift.endTime ?? null),
          breakMinutes: isWeekend ? undefined : formData.shift.breakMinutes,
          expectedWorkHours: isWeekend
            ? undefined
            : formData.shift.expectedWorkHours,
          minimumHoursForPresent: isWeekend
            ? undefined
            : formData.shift.minimumHoursForPresent,
        }
      })
      setFormData((prev) => ({ ...prev, shiftDayAndWeekDays: allDayConfigs }))
    }
  }, [
    weekDays?.data,
    isEditMode,
    isPopupOpen,
    formData.shiftDayAndWeekDays.length,
    formData.shift.startTime,
    formData.shift.endTime,
    formData.shift.breakMinutes,
    formData.shift.expectedWorkHours,
    formData.shift.minimumHoursForPresent,
  ])

  // ─── Re-sync day configs when shift values change ─────────────────────────

  useEffect(() => {
    if (!isPopupOpen || formData.shiftDayAndWeekDays.length === 0) return
    setFormData((prev) => ({
      ...prev,
      shiftDayAndWeekDays: prev.shiftDayAndWeekDays.map((c) => ({
        ...c,
        ...computeDayValues(c.dayType as DayType, prev.shift),
      })),
    }))
  }, [
    formData.shift.startTime,
    formData.shift.endTime,
    formData.shift.breakMinutes,
    formData.shift.expectedWorkHours,
    formData.shift.minimumHoursForPresent,
    isPopupOpen,
    formData.shiftDayAndWeekDays.length,
  ])

  // ─── Edit handler ─────────────────────────────────────────────────────────

  const handleEditClick = (item: any) => {
    setIsEditMode(true)
    setEditingTimingId(item.shift?.shiftId || null)
    setFormData({
      shift: {
        ...item.shift,
        updatedBy: userData?.userId || 0,
      },
      // backend returns shiftDayConfigs, map to our local key
      shiftDayAndWeekDays:
        item.shiftDayConfigs || item.shiftDayAndWeekDays || [],
    })
    setIsPopupOpen(true)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <Clock className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Shifts & WeekDay Config</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search shifts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-amber-400 hover:bg-amber-500 text-black"
            onClick={() => setIsPopupOpen(true)}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead
                onClick={() => handleSort('shiftName')}
                className="cursor-pointer"
              >
                Shift Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('shiftCode')}
                className="cursor-pointer"
              >
                Code <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('shiftType')}
                className="cursor-pointer"
              >
                Type <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('startTime')}
                className="cursor-pointer"
              >
                Start Time <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('endTime')}
                className="cursor-pointer"
              >
                End Time <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!shift || shift.data === undefined ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  Loading shifts...
                </TableCell>
              </TableRow>
            ) : !shift.data || shift.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No shifts found
                </TableCell>
              </TableRow>
            ) : paginatedTimings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No shifts match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedTimings.map((item: any, index: number) => {
                const shiftId = item.shift?.shiftId
                const isExpanded = expandedRows.has(shiftId)
                const dayConfigs: any[] =
                  item.shiftDayConfigs || item.shiftDayAndWeekDays || []
                const dayTypeBadgeClass = (dt: string) =>
                  dt === 'Weekend'
                    ? 'bg-red-100 text-red-600'
                    : dt === 'HalfDay'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'

                return (
                  <>
                    <TableRow
                      key={`row-${index}`}
                      className="cursor-pointer hover:bg-amber-50"
                      onClick={() => toggleRowExpand(shiftId)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          {(currentPage - 1) * timingsPerPage + index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.shift?.shiftName}
                      </TableCell>
                      <TableCell>{item.shift?.shiftCode}</TableCell>
                      <TableCell>{item.shift?.shiftType}</TableCell>
                      <TableCell>{formatTime(item.shift?.startTime)}</TableCell>
                      <TableCell>{formatTime(item.shift?.endTime)}</TableCell>
                      <TableCell>{item.shift?.companyName || 'N/A'}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.shift?.status
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.shift?.status ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-600 hover:text-amber-700"
                            onClick={() => handleEditClick(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setDeletingTimingId(item.shift?.shiftId || null)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow
                        key={`expand-${index}`}
                        className="bg-amber-50/40"
                      >
                        <TableCell colSpan={9} className="py-3 px-6">
                          <div className="text-xs font-semibold text-gray-500 mb-2">
                            Weekday Configuration
                          </div>
                          <div className="space-y-1">
                            {dayConfigs.length === 0 ? (
                              <p className="text-xs text-gray-400">
                                No weekday configs found.
                              </p>
                            ) : (
                              dayConfigs.map((c: any) => (
                                <div
                                  key={c.weekDayId}
                                  className="flex items-center gap-4 text-xs border rounded px-3 py-1.5 bg-white"
                                >
                                  <span className="font-medium w-20">
                                    {c.weekDay}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-medium ${dayTypeBadgeClass(c.dayType)}`}
                                  >
                                    {c.dayType}
                                  </span>
                                  {c.dayType !== 'Weekend' && (
                                    <>
                                      <span className="text-gray-500">
                                        Start:{' '}
                                        <span className="text-gray-800">
                                          {formatTime(c.startTime)}
                                        </span>
                                      </span>
                                      <span className="text-gray-500">
                                        End:{' '}
                                        <span className="text-gray-800">
                                          {formatTime(c.endTime)}
                                        </span>
                                      </span>
                                      <span className="text-gray-500">
                                        Break:{' '}
                                        <span className="text-gray-800">
                                          {c.breakMinutes} min
                                        </span>
                                      </span>
                                      <span className="text-gray-500">
                                        Exp Hrs:{' '}
                                        <span className="text-gray-800">
                                          {c.expectedWorkHours}
                                        </span>
                                      </span>
                                      <span className="text-gray-500">
                                        Min Hrs:{' '}
                                        <span className="text-gray-800">
                                          {c.minimumHoursForPresent}
                                        </span>
                                      </span>
                                    </>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {sortedTimings.length > 0 && (
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

      {/* Add / Edit Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Shift' : 'Add Shift'}
        size="sm:max-w-5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* ── Shift Info ── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Company — CustomCombobox (foreign key) */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="companyId">
                Company <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  companies?.data?.map((c: any) => ({
                    id: c.companyId.toString(),
                    name: c.companyName,
                  })) || []
                }
                value={
                  formData.shift.companyId
                    ? {
                        id: formData.shift.companyId.toString(),
                        name:
                          companies?.data?.find(
                            (c: any) => c.companyId === formData.shift.companyId
                          )?.companyName || formData.shift.companyId.toString(),
                      }
                    : null
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    shift: {
                      ...prev.shift,
                      companyId: value ? Number(value.id) : 0,
                    },
                  }))
                }
                placeholder="Select company"
              />
            </div>

            {/* Shift Name */}
            <div className="space-y-2">
              <Label htmlFor="shiftName">
                Shift Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shiftName"
                name="shiftName"
                value={formData.shift.shiftName}
                onChange={handleShiftChange}
                placeholder="e.g. Morning Shift"
                required
              />
            </div>

            {/* Shift Code */}
            <div className="space-y-2">
              <Label htmlFor="shiftCode">
                Shift Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shiftCode"
                name="shiftCode"
                value={formData.shift.shiftCode}
                onChange={handleShiftChange}
                placeholder="e.g. MS-01"
                required
              />
            </div>

            {/* Shift Type — Select enum */}
            <div className="space-y-2">
              <Label htmlFor="shiftType">
                Shift Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.shift.shiftType}
                onValueChange={(value) =>
                  handleShiftSelectChange('shiftType', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift type" />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.shift.startTime}
                onChange={handleShiftChange}
                required
              />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="endTime">
                End Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.shift.endTime}
                onChange={handleShiftChange}
                required
              />
            </div>

            {/* Break Minutes */}
            <div className="space-y-2">
              <Label htmlFor="breakMinutes">Break Minutes</Label>
              <Input
                id="breakMinutes"
                name="breakMinutes"
                type="number"
                min={0}
                value={formData.shift.breakMinutes}
                onChange={(e) => handleShiftNumberChange(e, 'breakMinutes')}
              />
            </div>

            {/* Expected Work Hours */}
            <div className="space-y-2">
              <Label htmlFor="expectedWorkHours">Expected Work Hours</Label>
              <Input
                id="expectedWorkHours"
                name="expectedWorkHours"
                type="number"
                min={0}
                step={0.5}
                value={formData.shift.expectedWorkHours}
                onChange={(e) =>
                  handleShiftNumberChange(e, 'expectedWorkHours')
                }
              />
            </div>

            {/* Minimum Hours for Present */}
            <div className="space-y-2">
              <Label htmlFor="minimumHoursForPresent">
                Min. Hours for Present
              </Label>
              <Input
                id="minimumHoursForPresent"
                name="minimumHoursForPresent"
                type="number"
                min={0}
                step={0.5}
                value={formData.shift.minimumHoursForPresent}
                onChange={(e) =>
                  handleShiftNumberChange(e, 'minimumHoursForPresent')
                }
              />
            </div>

            {/* Cross Day — CustomSwitch */}
            <div className="space-y-2 flex items-end pb-1">
              <CustomSwitch
                label="Cross Day"
                checked={formData.shift.crossDay}
                onChange={(value) => handleShiftSwitchChange('crossDay', value)}
              />
            </div>

            {/* Is Flexible — CustomSwitch */}
            <div className="space-y-2 flex items-end pb-1">
              <CustomSwitch
                label="Flexible"
                checked={formData.shift.isFlexible}
                onChange={(value) =>
                  handleShiftSwitchChange('isFlexible', value)
                }
              />
            </div>

            {/* Flexible In From / To — shown only when isFlexible */}
            {formData.shift.isFlexible && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="flexibleInFrom">Flexible In From</Label>
                  <Input
                    id="flexibleInFrom"
                    name="flexibleInFrom"
                    type="time"
                    value={formData.shift.flexibleInFrom ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shift: {
                          ...prev.shift,
                          flexibleInFrom: e.target.value || null,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flexibleInTo">Flexible In To</Label>
                  <Input
                    id="flexibleInTo"
                    name="flexibleInTo"
                    type="time"
                    value={formData.shift.flexibleInTo ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shift: {
                          ...prev.shift,
                          flexibleInTo: e.target.value || null,
                        },
                      }))
                    }
                  />
                </div>
              </>
            )}

            {/* Status — CustomSwitch */}
            <div className="col-span-2">
              <CustomSwitch
                label="Status"
                checked={formData.shift.status}
                onChange={(value) => handleShiftSwitchChange('status', value)}
              />
            </div>
          </div>

          {/* ── Weekday Configuration ── */}
          <div>
            <h3 className="text-md font-semibold mb-3">
              Weekday Configuration <span className="text-red-500">*</span>
            </h3>
            <div className="space-y-2">
              {formData.shiftDayAndWeekDays.map((config) => {
                const dayTypeBadge =
                  config.dayType === 'Weekend'
                    ? 'bg-red-100 text-red-600'
                    : config.dayType === 'HalfDay'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'

                return (
                  <div key={config.weekDayId} className="border rounded-md p-3">
                    {/* Single row: day name | dayType | all fields */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Day name */}
                      <span className="text-sm font-semibold w-20 shrink-0">
                        {config.weekDay}
                      </span>

                      {/* Day Type select */}
                      <Select
                        value={config.dayType}
                        onValueChange={(value) =>
                          handleDayTypeChange(
                            config.weekDayId,
                            value as DayType
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-32 text-xs shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAY_TYPE_OPTIONS.map((dt) => (
                            <SelectItem key={dt} value={dt}>
                              {dt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {config.dayType !== 'Weekend' ? (
                        <>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-gray-400">
                              Start Time
                            </span>
                            <Input
                              type="time"
                              className="h-8 text-xs w-32"
                              value={config.startTime ?? ''}
                              onChange={(e) =>
                                handleDayConfigFieldChange(
                                  config.weekDayId,
                                  'startTime',
                                  e.target.value || null
                                )
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-gray-400">
                              End Time
                            </span>
                            <Input
                              type="time"
                              className="h-8 text-xs w-32"
                              value={config.endTime ?? ''}
                              onChange={(e) =>
                                handleDayConfigFieldChange(
                                  config.weekDayId,
                                  'endTime',
                                  e.target.value || null
                                )
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-gray-400">
                              Break (min)
                            </span>
                            <Input
                              type="number"
                              min={0}
                              className="h-8 text-xs w-20"
                              value={config.breakMinutes ?? ''}
                              onChange={(e) =>
                                handleDayConfigFieldChange(
                                  config.weekDayId,
                                  'breakMinutes',
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-gray-400">
                              Expected Hrs
                            </span>
                            <Input
                              type="number"
                              min={0}
                              step={0.5}
                              className="h-8 text-xs w-24"
                              value={config.expectedWorkHours ?? ''}
                              onChange={(e) =>
                                handleDayConfigFieldChange(
                                  config.weekDayId,
                                  'expectedWorkHours',
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-gray-400">
                              Min Hrs Present
                            </span>
                            <Input
                              type="number"
                              min={0}
                              step={0.5}
                              className="h-8 text-xs w-24"
                              value={config.minimumHoursForPresent ?? ''}
                              onChange={(e) =>
                                handleDayConfigFieldChange(
                                  config.weekDayId,
                                  'minimumHoursForPresent',
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value)
                                )
                              }
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Weekend — no working hours
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
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

      {/* Delete Confirm */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this shift? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTimingId) {
                  deleteMutation.mutate({ id: deletingTimingId })
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

export default ShiftAndWeekDays
