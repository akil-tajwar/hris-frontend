'use client'

import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
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
import { ArrowUpDown, CalendarDays, Search } from 'lucide-react'
import { Popup } from '@/utils/popup'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useCreateEmployeeLeaveApplication,
  useGetEmployeeLeaveApplications,
  useGetLeaveTypes,
  useGetHolidayCalendars,
  useGetNewHolidays,
  useGetEmployeeWeekDays,
} from '@/hooks/use-api'
import { CustomCombobox } from '@/utils/custom-combobox'
import type {
  CreateEmployeeLeaveApply,
  GetEmployeeLeaveApply,
  GetNewHolidayType,
} from '@/utils/type'
import { Badge } from '@/components/ui/badge'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toDateOnly = (d: Date | string) => {
  const dt = typeof d === 'string' ? new Date(d) : d
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
}

const countDays = (
  from: string,
  to: string,
  sandwichApplicable: boolean,
  holidayDates: Set<string>, // 'YYYY-MM-DD'
  weekendDayNames: Set<string> // 'Monday', 'Tuesday', …
): number => {
  if (!from || !to) return 0
  const start = toDateOnly(from)
  const end = toDateOnly(to)
  if (end < start) return 0

  if (!sandwichApplicable) {
    return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1
  }

  // sandwich policy: exclude weekends and holidays
  let count = 0
  const cursor = new Date(start)
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  while (cursor <= end) {
    const dayName = dayNames[cursor.getDay()]
    const iso = cursor.toISOString().split('T')[0]
    if (!weekendDayNames.has(dayName) && !holidayDates.has(iso)) {
      count++
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

const statusBadge = (status: string) => {
  if (status === 'Approved')
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        {status}
      </Badge>
    )
  if (status === 'Rejected')
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200">{status}</Badge>
    )
  return (
    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
      {status}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LeaveApply = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: leaveApplications } = useGetEmployeeLeaveApplications()
  const { data: leaveTypes } = useGetLeaveTypes()
  console.log("🚀 ~ LeaveApply ~ leaveTypes:", leaveTypes)
  const { data: holidayCalendars } = useGetHolidayCalendars()
  const { data: weekDaysData } = useGetEmployeeWeekDays(userData?.userId ?? 0)
  console.log("🚀 ~ LeaveApply ~ weekDaysData:", weekDaysData)
  const { data: allHolidays } = useGetNewHolidays()

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] =
    useState<keyof GetEmployeeLeaveApply>('effectiveFrom')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const itemsPerPage = 10

  const emptyForm = useCallback(
    (): Omit<
      CreateEmployeeLeaveApply,
      | 'employeeLeaveApplyId'
      | 'approvedByRepAuth'
      | 'approvedByHr'
      | 'createdAt'
      | 'updatedBy'
      | 'updatedAt'
    > => ({
      employeeId: 0,
      leaveTypeId: 0,
      effectiveFrom: new Date(),
      effectiveTo: null,
      noOfDays: 0,
      status: 'Pending',
      createdBy: userData?.userId ?? 0,
    }),
    [userData?.userId]
  )

  const [formData, setFormData] = useState(emptyForm)
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [effectiveTo, setEffectiveTo] = useState('')

  // Weekend day names set for this employee
  const weekendDayNames = useMemo<Set<string>>(() => {
    if (!weekDaysData?.weekDays) return new Set()
    return new Set(
      weekDaysData.weekDays
        .filter((w: any) => w.dayType === 'Weekend')
        .map((w: any) => w.day as string)
    )
  }, [weekDaysData])

  // Holiday dates set (ISO strings) for the relevant year
  const holidayDates = useMemo<Set<string>>(() => {
    if (!holidayCalendars?.data || !allHolidays?.data || !effectiveFrom)
      return new Set()
    const year = new Date(effectiveFrom).getFullYear()
    const calendar = (holidayCalendars.data as any[]).find(
      (c) => c.year === year
    )
    if (!calendar) return new Set()
    const dates = (allHolidays.data as GetNewHolidayType[])
      .filter((h) => h.calendarId === calendar.id && h.date)
      .map((h) => h.date as string)
    return new Set(dates)
  }, [holidayCalendars, allHolidays, effectiveFrom])

  // Selected leave type
  const selectedLeaveType = useMemo(() => {
    if (!leaveTypes?.data || !formData.leaveTypeId) return null
    return (
      (leaveTypes.data as any[]).find(
        (lt) => lt.leaveTypeId === formData.leaveTypeId
      ) ?? null
    )
  }, [leaveTypes, formData.leaveTypeId])

  // Recalculate noOfDays whenever dates or leave type changes
  const recalcDays = useCallback(
    (from: string, to: string, lt: any | null) => {
      if (!from || !to || !lt) return 0
      return countDays(
        from,
        to,
        !!lt.sandwichPolicyApplicable,
        holidayDates,
        weekendDayNames
      )
    },
    [holidayDates, weekendDayNames]
  )

  const handleDateChange = (
    field: 'effectiveFrom' | 'effectiveTo',
    value: string
  ) => {
    if (field === 'effectiveFrom') {
      setEffectiveFrom(value)
      const days = recalcDays(value, effectiveTo, selectedLeaveType)
      setFormData((prev) => ({
        ...prev,
        effectiveFrom: new Date(value),
        noOfDays: days,
      }))
    } else {
      setEffectiveTo(value)
      const days = recalcDays(effectiveFrom, value, selectedLeaveType)
      setFormData((prev) => ({
        ...prev,
        effectiveTo: new Date(value),
        noOfDays: days,
      }))
    }
  }

  const handleLeaveTypeChange = (
    value: { id: string; name: string } | null
  ) => {
    const leaveTypeId = value ? Number(value.id) : 0
    const lt =
      leaveTypes?.data?.find((l: any) => l.leaveTypeId === leaveTypeId) ?? null
    const days = recalcDays(effectiveFrom, effectiveTo, lt)
    setFormData((prev) => ({ ...prev, leaveTypeId, noOfDays: days }))
  }

  const reset = useCallback(() => {
    setFormData(emptyForm())
    setEffectiveFrom('')
    setEffectiveTo('')
    setError(null)
  }, [emptyForm])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    reset()
  }, [reset])

  const createMutation = useCreateEmployeeLeaveApplication({
    onClose: closePopup,
    reset,
  })

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      if (!formData.leaveTypeId) {
        setError('Please select a leave type.')
        return
      }
      if (!effectiveFrom) {
        setError('Please select a start date.')
        return
      }
      if (!effectiveTo) {
        setError('Please select an end date.')
        return
      }
      if (new Date(effectiveTo) < new Date(effectiveFrom)) {
        setError('End date cannot be before start date.')
        return
      }

      createMutation.mutate({
        ...formData,
        employeeId: userData?.userId ?? 0,
        createdBy: userData?.userId ?? 0,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: new Date(effectiveTo),
      } as CreateEmployeeLeaveApply)
    },
    [formData, effectiveFrom, effectiveTo, createMutation, userData]
  )

  // Table data — only this employee's applications
  const myApplications = useMemo<GetEmployeeLeaveApply[]>(() => {
    if (!leaveApplications?.data) return []
    return leaveApplications.data.filter(
      (a: GetEmployeeLeaveApply) => a.employeeId === userData?.userId
    )
  }, [leaveApplications, userData?.userId])

  const filtered = useMemo(() => {
    return myApplications.filter(
      (a) =>
        a.leaveTypeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.status?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [myApplications, searchTerm])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = String(a[sortColumn] ?? '')
      const bv = String(b[sortColumn] ?? '')
      return sortDirection === 'asc'
        ? av.localeCompare(bv)
        : bv.localeCompare(av)
    })
  }, [filtered, sortColumn, sortDirection])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sorted.slice(start, start + itemsPerPage)
  }, [sorted, currentPage])

  const totalPages = Math.ceil(sorted.length / itemsPerPage)

  const handleSort = (col: keyof GetEmployeeLeaveApply) => {
    if (col === sortColumn)
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

  const leaveTypeItems = useMemo(() => {
    if (!leaveTypes?.data) return []
    return (leaveTypes.data as any[]).map((lt) => ({
      id: lt.leaveTypeId.toString(),
      name: lt.name,
    }))
  }, [leaveTypes])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-md">
            <CalendarDays className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">My Leave Applications</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-56"
            />
          </div>
          <Button
            className="bg-blue-400 hover:bg-blue-500 text-black"
            onClick={() => setIsPopupOpen(true)}
          >
            Apply
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
                className="cursor-pointer"
                onClick={() => handleSort('leaveTypeName')}
              >
                Leave Type <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('effectiveFrom')}
              >
                From <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('effectiveTo')}
              >
                To <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('noOfDays')}
              >
                Days <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('status')}
              >
                Status <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!leaveApplications ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No leave applications found
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((a, i) => (
                <TableRow key={a.employeeLeaveApplyId}>
                  <TableCell>
                    {(currentPage - 1) * itemsPerPage + i + 1}
                  </TableCell>
                  <TableCell>{a.leaveTypeName}</TableCell>
                  <TableCell>{String(a.effectiveFrom).split('T')[0]}</TableCell>
                  <TableCell>
                    {a.effectiveTo ? String(a.effectiveTo).split('T')[0] : '—'}
                  </TableCell>
                  <TableCell>{a.noOfDays}</TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className={
                  currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                }
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, idx) => (
              <PaginationItem key={idx}>
                <PaginationLink
                  onClick={() => setCurrentPage(idx + 1)}
                  isActive={currentPage === idx + 1}
                >
                  {idx + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
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
      )}

      {/* Apply Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title="Apply for Leave"
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>
                Leave Type <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={leaveTypeItems}
                value={
                  formData.leaveTypeId
                    ? {
                        id: formData.leaveTypeId.toString(),
                        name:
                          leaveTypeItems.find(
                            (lt) => lt.id === formData.leaveTypeId.toString()
                          )?.name || '',
                      }
                    : null
                }
                onChange={handleLeaveTypeChange}
                placeholder="Select leave type"
              />
            </div>

            <div className="space-y-2">
              <Label>
                From <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={effectiveFrom}
                onChange={(e) =>
                  handleDateChange('effectiveFrom', e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                To <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={effectiveTo}
                onChange={(e) =>
                  handleDateChange('effectiveTo', e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>No. of Days</Label>
              <Input
                type="number"
                value={formData.noOfDays}
                readOnly
                className="bg-muted cursor-not-allowed"
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </Popup>
    </div>
  )
}

export default LeaveApply
