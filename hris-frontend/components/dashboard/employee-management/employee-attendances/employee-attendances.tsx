'use client'

import type React from 'react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
  ArrowUpDown,
  Search,
  Clock,
  Edit2,
  Trash2,
  Calendar,
  Plus,
  UserX,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateEmployeeAttendanceType,
  GetEmployeeAttendanceType,
  GetEmployeeType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddEmployeeAttendance,
  useDeleteEmployeeAttendance,
  useGetEmployeeAttendances,
  useUpdateEmployeeAttendance,
  useGetAllEmployees,
  useGetOfficeTimingWeekends,
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
import { formatDate, formatTime } from '@/utils/conversions'
import { CustomCombobox } from '@/utils/custom-combobox'

const EmployeeAttendances = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: employeeAttendances } = useGetEmployeeAttendances()
  const { data: employees } = useGetAllEmployees()
  const { data: officeTimingWeekends } = useGetOfficeTimingWeekends()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [groupsPerPage] = useState(5)
  const [sortColumn, setSortColumn] =
    useState<keyof GetEmployeeAttendanceType>('employeeName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAttendanceId, setEditingAttendanceId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingAttendanceId, setDeletingAttendanceId] = useState<
    number | null
  >(null)

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  const [attendanceForms, setAttendanceForms] = useState<
    GetEmployeeAttendanceType[]
  >([])

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const calculateTimeDifference = (
    actualTime: string,
    expectedTime: string,
    isLate: boolean
  ): number => {
    const [actualHours, actualMinutes] = actualTime.split(':').map(Number)
    const [expectedHours, expectedMinutes] = expectedTime.split(':').map(Number)
    const actualTotal = actualHours * 60 + actualMinutes
    const expectedTotal = expectedHours * 60 + expectedMinutes
    const diff = actualTotal - expectedTotal
    return isLate ? Math.max(0, diff) : Math.max(0, -diff)
  }

  const getOfficeTimingForEmployee = useCallback(
    (emp: GetEmployeeType) => {
      const officeTiming = officeTimingWeekends?.data?.find(
        (ot: any) => ot.officeTimingId === emp.officeTimingId
      )
      return {
        startTime: officeTiming?.startTime || '09:00',
        endTime: officeTiming?.endTime || '17:00',
      }
    },
    [officeTimingWeekends?.data]
  )

  const buildEmptyRow = (): GetEmployeeAttendanceType => ({
    employeeId: 0,
    employeeName: '',
    empCode: '',
    designationName: '',
    departmentName: '',
    inTime: '09:00',
    outTime: '17:00',
    lateInMinutes: 0,
    earlyOutMinutes: 0,
    officeStartTime: '09:00',
    officeEndTime: '17:00',
    isAbsent: 0,
    attendanceDate: selectedDate,
    createdBy: userData?.userId || 0,
  })

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleAddRow = () => {
    setAttendanceForms((prev) => [...prev, buildEmptyRow()])
  }

  const handleRemoveRow = (index: number) => {
    setAttendanceForms((prev) => prev.filter((_, i) => i !== index))
  }

  const handleEmployeeChange = (index: number, emp: GetEmployeeType | null) => {
    setAttendanceForms((prev) => {
      const updated = [...prev]
      if (!emp) {
        updated[index] = {
          ...updated[index],
          employeeId: 0,
          employeeName: '',
        }
        return updated
      }
      const { startTime, endTime } = getOfficeTimingForEmployee(emp)
      updated[index] = {
        ...updated[index],
        employeeId: emp.employeeId!,
        employeeName: emp.empFullName,
        officeStartTime: startTime,
        officeEndTime: endTime,
        inTime: startTime,
        outTime: endTime,
        lateInMinutes: 0,
        earlyOutMinutes: 0,
      }
      return updated
    })
  }

  const handleAbsentChange = (index: number, checked: boolean) => {
    setAttendanceForms((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        isAbsent: checked ? 1 : 0,
        inTime: checked ? '' : updated[index].officeStartTime,
        outTime: checked ? '' : updated[index].officeEndTime,
        lateInMinutes: checked ? 0 : updated[index].lateInMinutes,
        earlyOutMinutes: checked ? 0 : updated[index].earlyOutMinutes,
      }
      return updated
    })
  }

  const handleTimeChange = (
    index: number,
    field: 'inTime' | 'outTime',
    value: string
  ) => {
    setAttendanceForms((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      if (field === 'inTime') {
        updated[index].lateInMinutes = calculateTimeDifference(
          value,
          updated[index].officeStartTime,
          true
        )
      } else {
        updated[index].earlyOutMinutes = calculateTimeDifference(
          value,
          updated[index].officeEndTime,
          false
        )
      }
      return updated
    })
  }

  const resetForm = useCallback(() => {
    setAttendanceForms([])
    setSelectedDate(new Date().toISOString().split('T')[0])
    setEditingAttendanceId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddEmployeeAttendance({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateEmployeeAttendance({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteEmployeeAttendance({
    onClose: closePopup,
    reset: resetForm,
  })

  // ── Sorting / filtering ───────────────────────────────────────────────────────

  const handleSort = (column: keyof GetEmployeeAttendanceType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredAttendances = useMemo(() => {
    if (!employeeAttendances?.data || !Array.isArray(employeeAttendances.data))
      return []
    return employeeAttendances.data.filter((a) =>
      a.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employeeAttendances?.data, searchTerm])

  const groupedAttendances = useMemo(() => {
    const groups = filteredAttendances.reduce(
      (acc, attendance) => {
        const date = attendance.attendanceDate
        if (!acc[date]) acc[date] = []
        acc[date].push(attendance)
        return acc
      },
      {} as Record<string, GetEmployeeAttendanceType[]>
    )

    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => {
        const av = a[sortColumn] ?? ''
        const bv = b[sortColumn] ?? ''
        if (typeof av === 'string' && typeof bv === 'string')
          return sortDirection === 'asc'
            ? av.localeCompare(bv)
            : bv.localeCompare(av)
        return sortDirection === 'asc' ? (av > bv ? 1 : -1) : bv > av ? 1 : -1
      })
    })

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredAttendances, sortColumn, sortDirection])

  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * groupsPerPage
    return groupedAttendances.slice(start, start + groupsPerPage)
  }, [groupedAttendances, currentPage, groupsPerPage])

  const totalPages = Math.ceil(groupedAttendances.length / groupsPerPage)

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      try {
        const validForms = attendanceForms.filter(
          (form) => form.employeeId !== null
        )

        if (validForms.length === 0) {
          setError('Please add at least one employee')
          return
        }

        if (isEditMode && editingAttendanceId) {
          const form = validForms[0]
          await updateMutation.mutateAsync({
            id: editingAttendanceId,
            data: {
              employeeId: form.employeeId!,
              attendanceDate: selectedDate,
              inTime: form.isAbsent ? undefined : form.inTime,
              outTime: form.isAbsent ? undefined : form.outTime,
              lateInMinutes: form.isAbsent ? undefined : form.lateInMinutes,
              earlyOutMinutes: form.isAbsent ? undefined : form.earlyOutMinutes,
              isAbsent: form.isAbsent,
              updatedBy: userData?.userId || 0,
            } as GetEmployeeAttendanceType,
          })
        } else {
          const attendancesArray: CreateEmployeeAttendanceType[] =
            validForms.map((form) => ({
              employeeId: form.employeeId!,
              attendanceDate: selectedDate,
              inTime: form.isAbsent ? undefined : form.inTime,
              outTime: form.isAbsent ? undefined : form.outTime,
              lateInMinutes: form.isAbsent ? undefined : form.lateInMinutes,
              earlyOutMinutes: form.isAbsent ? undefined : form.earlyOutMinutes,
              isAbsent: form.isAbsent,
              createdBy: userData?.userId || 0,
            }))
          await addMutation.mutateAsync(attendancesArray as any)
        }
      } catch (err) {
        setError('Failed to save attendance')
        console.error(err)
      }
    },
    [
      attendanceForms,
      selectedDate,
      isEditMode,
      editingAttendanceId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error)
      setError('Error saving attendance')
  }, [addMutation.error, updateMutation.error])

  // ── Edit click ────────────────────────────────────────────────────────────────

  const handleEditClick = (attendance: GetEmployeeAttendanceType) => {
    const employee = employees?.data?.find(
      (emp: GetEmployeeType) => emp.employeeId === attendance.employeeId
    )

    if (employee && officeTimingWeekends?.data) {
      const { startTime, endTime } = getOfficeTimingForEmployee(employee)

      setAttendanceForms([
        {
          employeeId: attendance.employeeId,
          employeeName: attendance.employeeName,
          empCode: attendance.empCode || '',
          designationName: attendance.designationName || '',
          departmentName: attendance.departmentName || '',
          inTime: attendance.inTime || '',
          outTime: attendance.outTime || '',
          lateInMinutes: attendance.lateInMinutes || 0,
          earlyOutMinutes: attendance.earlyOutMinutes || 0,
          officeStartTime: startTime,
          officeEndTime: endTime,
          isAbsent: (attendance.isAbsent as 0 | 1) ?? 0,
          attendanceDate: attendance.attendanceDate,
          createdBy: userData?.userId || 0,
        },
      ])

      setSelectedDate(attendance.attendanceDate)
      setEditingAttendanceId(attendance.employeeAttendanceId!)
      setIsEditMode(true)
      setIsPopupOpen(true)
    }
  }

  // ── IDs already used in the form (to exclude from combobox) ──────────────────
  const usedEmployeeIds = useMemo(
    () => attendanceForms.map((f) => f.employeeId).filter(Boolean) as number[],
    [attendanceForms]
  )

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <Clock className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Employee Attendances</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-black"
            onClick={() => {
              setAttendanceForms([buildEmptyRow()])
              setIsPopupOpen(true)
            }}
          >
            Add Attendance
          </Button>
        </div>
      </div>

      {/* Attendance list */}
      <div className="space-y-6">
        {!employeeAttendances || employeeAttendances.data === undefined ? (
          <div className="text-center py-8 text-gray-500">
            Loading attendances...
          </div>
        ) : !employeeAttendances.data ||
          employeeAttendances.data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No attendances found
          </div>
        ) : paginatedGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No attendances match your search
          </div>
        ) : (
          paginatedGroups.map(([date, attendances]) => (
            <div
              key={date}
              className="rounded-lg border border-gray-200 overflow-hidden shadow-sm"
            >
              {/* Date Header */}
              <div className="bg-amber-200 px-6 py-4 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-black" />
                <h3 className="text-lg font-semibold text-black">
                  {formatDate(new Date(date))}
                </h3>
                <span className="ml-auto bg-black/10 px-3 py-1 rounded-full text-sm font-medium text-black">
                  {attendances.length}{' '}
                  {attendances.length === 1 ? 'employee' : 'employees'}
                </span>
              </div>

              {/* Table */}
              <div className="bg-white">
                <Table>
                  <TableHeader className="bg-amber-50">
                    <TableRow>
                      <TableHead className="w-20">Sl No.</TableHead>
                      <TableHead
                        onClick={() => handleSort('employeeName')}
                        className="cursor-pointer transition-colors"
                      >
                        Employee Name
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort('inTime')}
                        className="cursor-pointer transition-colors"
                      >
                        In Time <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort('outTime')}
                        className="cursor-pointer transition-colors"
                      >
                        Out Time <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead>Late In (mins)</TableHead>
                      <TableHead>Early Out (mins)</TableHead>
                      <TableHead>Absent</TableHead>
                      {/* <TableHead className="text-right">Action</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendances.map((attendance: any, index) => (
                      <TableRow
                        key={attendance.employeeAttendanceId || index}
                        className={`hover:bg-amber-50/50 ${attendance.isAbsent ? 'bg-red-50/40' : ''}`}
                      >
                        <TableCell className="font-medium text-gray-600">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {attendance.employeeName}
                        </TableCell>
                        <TableCell>
                          {attendance.isAbsent ? (
                            <span className="text-gray-400 text-xs">—</span>
                          ) : (
                            formatTime(attendance.inTime)
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance.isAbsent ? (
                            <span className="text-gray-400 text-xs">—</span>
                          ) : (
                            formatTime(attendance.outTime)
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance.isAbsent ? (
                            <span className="text-gray-400 text-xs">—</span>
                          ) : (
                            <span
                              className={
                                attendance.lateInMinutes > 0
                                  ? 'text-red-600 font-semibold'
                                  : 'text-gray-600'
                              }
                            >
                              {attendance.lateInMinutes}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance.isAbsent ? (
                            <span className="text-gray-400 text-xs">—</span>
                          ) : (
                            <span
                              className={
                                attendance.earlyOutMinutes > 0
                                  ? 'text-red-600 font-semibold'
                                  : 'text-gray-600'
                              }
                            >
                              {attendance.earlyOutMinutes}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance.isAbsent === 1 &&
                          attendance.isLeave === 1 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                              Leave
                            </span>
                          ) : attendance.isAbsent === 1 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              <UserX className="h-3 w-3" /> Absent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              Present
                            </span>
                          )}
                        </TableCell>
                        {/* <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => handleEditClick(attendance)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setDeletingAttendanceId(
                                  attendance.employeeAttendanceId
                                )
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {groupedAttendances.length > 0 && totalPages > 1 && (
        <div className="mt-6">
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

      {/* ── Add / Edit Popup ──────────────────────────────────────────────────── */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Attendance' : 'Add Attendance'}
        size="max-w-6xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Date picker */}
          <div className="space-y-2">
            <Label htmlFor="attendanceDate">
              Attendance Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="attendanceDate"
              name="attendanceDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="max-w-xs"
            />
          </div>

          {/* Rows table */}
          {attendanceForms.length > 0 && (
            <Table className="border">
              <TableHeader className="bg-gray-50 sticky top-0">
                <TableRow>
                  <TableHead className="w-10">Absent</TableHead>
                  <TableHead className="w-52">Employee</TableHead>
                  <TableHead className="w-32">In Time</TableHead>
                  <TableHead className="w-32">Out Time</TableHead>
                  <TableHead className="w-28">Late (mins)</TableHead>
                  <TableHead className="w-28">Early Out (mins)</TableHead>
                  {!isEditMode && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceForms.map((form, index) => (
                  <TableRow
                    key={index}
                    className={form.isAbsent ? 'bg-red-50/50' : ''}
                  >
                    {/* Absent checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={form.isAbsent === 1}
                        onCheckedChange={(checked) =>
                          handleAbsentChange(index, checked as boolean)
                        }
                        className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                      />
                    </TableCell>

                    {/* Employee combobox */}
                    <TableCell>
                      {isEditMode ? (
                        <span className="font-medium text-sm">
                          {form.employeeName}
                        </span>
                      ) : (
                        <CustomCombobox
                          items={(employees?.data || [])
                            .filter(
                              (emp: GetEmployeeType) =>
                                emp.isActive === 1 &&
                                !usedEmployeeIds
                                  .filter((id) => id !== form.employeeId)
                                  .includes(emp.employeeId!)
                            )
                            .map((emp: GetEmployeeType) => ({
                              id: emp.employeeId!.toString(),
                              name: emp.empFullName,
                            }))}
                          value={
                            form.employeeId
                              ? {
                                  id: form.employeeId.toString(),
                                  name: form.employeeName,
                                }
                              : null
                          }
                          onChange={(value) => {
                            const emp = (employees?.data || []).find(
                              (e: GetEmployeeType) =>
                                e.employeeId?.toString() === value?.id
                            )
                            handleEmployeeChange(index, emp || null)
                          }}
                          placeholder="Select employee (Code - Name - Department - Designation)"
                        />
                      )}
                    </TableCell>

                    {/* In Time */}
                    <TableCell>
                      <Input
                        type="time"
                        value={form.inTime}
                        onChange={(e) =>
                          handleTimeChange(index, 'inTime', e.target.value)
                        }
                        disabled={
                          form.isAbsent === 1 || form.employeeId === null
                        }
                        className="w-full disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </TableCell>

                    {/* Out Time */}
                    <TableCell>
                      <Input
                        type="time"
                        value={form.outTime}
                        onChange={(e) =>
                          handleTimeChange(index, 'outTime', e.target.value)
                        }
                        disabled={
                          form.isAbsent === 1 || form.employeeId === null
                        }
                        className="w-full disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </TableCell>

                    {/* Late in */}
                    <TableCell>
                      <Input
                        type="number"
                        value={form.isAbsent ? '' : form.lateInMinutes}
                        readOnly
                        placeholder={form.isAbsent ? '—' : '0'}
                        className={`w-full bg-gray-50 cursor-not-allowed ${
                          !form.isAbsent && (form.lateInMinutes ?? 0) > 0
                            ? 'text-red-600 font-medium'
                            : 'text-gray-400'
                        }`}
                      />
                    </TableCell>

                    {/* Early out */}
                    <TableCell>
                      <Input
                        type="number"
                        value={form.isAbsent ? '' : form.earlyOutMinutes}
                        readOnly
                        placeholder={form.isAbsent ? '—' : '0'}
                        className={`w-full bg-gray-50 cursor-not-allowed ${
                          !form.isAbsent && (form.earlyOutMinutes ?? 0) > 0
                            ? 'text-orange-600 font-medium'
                            : 'text-gray-400'
                        }`}
                      />
                    </TableCell>

                    {/* Remove row button (add mode only) */}
                    {!isEditMode && (
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                          title="Remove row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Add More button (add mode only) */}
          {!isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddRow}
              className="gap-2 border-dashed border-amber-400 text-amber-700 hover:bg-amber-50"
            >
              <Plus className="h-4 w-4" />
              Add More
            </Button>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={closePopup}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {addMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : 'Save Attendance'}
            </Button>
          </div>
        </form>
      </Popup>

      {/* Delete dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance record? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingAttendanceId)
                  deleteMutation.mutate({ id: deletingAttendanceId })
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

export default EmployeeAttendances
