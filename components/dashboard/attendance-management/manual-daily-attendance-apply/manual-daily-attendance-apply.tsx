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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowUpDown, CalendarClock, Pencil, Search } from 'lucide-react'
import { Popup } from '@/utils/popup'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetAllAttendanceDailyByUserId,
  useGetAllAttendanceDailyApplyByUserId,
  useAddManualAttendanceDailyApply,
  useGetEmployeeWeekDays,
} from '@/hooks/use-api'
import { CustomCombobox } from '@/utils/custom-combobox'
import type {
  AttendanceDailyStatus,
  CreateAttendanceDailyApplyType,
  GetAttendanceDailyApplyType,
  GetAttendanceDailyType,
} from '@/utils/type'

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { id: AttendanceDailyStatus; name: string }[] = [
  { id: 'PRESENT', name: 'Present' },
  { id: 'ABSENT', name: 'Absent' },
  { id: 'LATE', name: 'Late' },
  { id: 'HALF_DAY', name: 'Half Day' },
  { id: 'HOLIDAY', name: 'Holiday' },
  { id: 'WEEKEND', name: 'Weekend' },
  { id: 'ON_LEAVE', name: 'On Leave' },
]

// The form only ever lets the employee pick from these three — Late /
// Half Day are derived automatically from firstIn/lastOut vs. shift config.
const FORM_STATUS_OPTIONS: {
  id: 'PRESENT' | 'ABSENT' | 'ON_LEAVE'
  name: string
}[] = [
  { id: 'PRESENT', name: 'Present' },
  { id: 'ABSENT', name: 'Absent' },
  { id: 'ON_LEAVE', name: 'On Leave' },
]

const statusLabel = (status: AttendanceDailyStatus) =>
  STATUS_OPTIONS.find((s) => s.id === status)?.name ?? status

const attendanceStatusBadge = (status: AttendanceDailyStatus) => {
  const map: Record<AttendanceDailyStatus, string> = {
    PRESENT: 'bg-green-100 text-green-700 border-green-200',
    ABSENT: 'bg-red-100 text-red-700 border-red-200',
    LATE: 'bg-orange-100 text-orange-700 border-orange-200',
    HALF_DAY: 'bg-blue-100 text-blue-700 border-blue-200',
    HOLIDAY: 'bg-purple-100 text-purple-700 border-purple-200',
    WEEKEND: 'bg-gray-100 text-gray-700 border-gray-200',
    ON_LEAVE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  }
  return <Badge className={map[status]}>{statusLabel(status)}</Badge>
}

const applyStatusBadge = (
  status: GetAttendanceDailyApplyType['applyStatus']
) => {
  if (status === 'Approved')
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        Approved
      </Badge>
    )
  if (status === 'Rejected')
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>
    )
  return (
    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
      Pending
    </Badge>
  )
}

const applyTypeBadge = (type: 'CREATE' | 'UPDATE') =>
  type === 'CREATE' ? (
    <Badge className="bg-blue-100 text-blue-700 border-blue-200">New</Badge>
  ) : (
    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
      Update
    </Badge>
  )

const toDateInputValue = (value: string | Date | null) => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

const toTimeInputValue = (value: string | null) => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`
}

// Combines a plain date (yyyy-mm-dd) with a time (HH:mm) into a naive
// datetime string. Kept timezone-free to match the drizzle `datetime`
// mode: 'string' column setup already in use elsewhere in the app.
const combineDateTime = (date: string, time: string): string | null => {
  if (!date || !time) return null
  return `${date}T${time}:00`
}

// Maps a JS Date's getDay() (Sun=0..Sat=6) to the app's custom weekDayId
// scheme returned by useGetEmployeeWeekDays (Friday=1 .. Thursday=7).
const getWeekDayIdForDate = (date: Date): number =>
  ((date.getDay() + 2) % 7) + 1

const timeStrToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

// Shape of a single row returned by useGetEmployeeWeekDays. Move this to
// utils/type.ts alongside the other Get*Type definitions if you'd rather
// keep all API shapes in one place.
type EmployeeWeekDay = {
  employeeId: number
  shiftId: number
  weekDayId: number
  day: string
  dayType: 'Weekend' | 'HalfDay' | 'FullDay' | string
  startTime: string
  endTime: string
  breakMinutes: number
  expectedWorkHours: number
  minimumHoursForPresent: number
}

type AttendanceOutcome = {
  status: AttendanceDailyStatus
  workedMinutes: number
  lateMinutes: number
  earlyOutMinutes: number
  overtimeMinutes: number
}

// Given firstIn/lastOut (HH:mm) and the employee's shift config for that
// weekday, work out the real status + minute breakdown. Half Day (not
// enough worked minutes) takes priority over Late if both would apply.
const computeAttendanceOutcome = (
  firstIn: string,
  lastOut: string,
  shiftDay: EmployeeWeekDay | undefined
): AttendanceOutcome => {
  if (!shiftDay || !firstIn || !lastOut) {
    return {
      status: 'PRESENT',
      workedMinutes: 0,
      lateMinutes: 0,
      earlyOutMinutes: 0,
      overtimeMinutes: 0,
    }
  }

  const shiftStart = timeStrToMinutes(shiftDay.startTime)
  const shiftEnd = timeStrToMinutes(shiftDay.endTime)
  const inMinutes = timeStrToMinutes(firstIn)
  const outMinutes = timeStrToMinutes(lastOut)

  const grossMinutes = Math.max(0, outMinutes - inMinutes)
  const workedMinutes = Math.max(0, grossMinutes - (shiftDay.breakMinutes ?? 0))

  const lateMinutes = Math.max(0, inMinutes - shiftStart)
  const earlyOutMinutes = Math.max(0, shiftEnd - outMinutes)
  const expectedMinutes = (shiftDay.expectedWorkHours ?? 0) * 60

  // Overtime = actual clock-time span worked beyond the expected gross
  // shift span — NOT based on workedMinutes (which already excludes
  // break). A worker who's late can still rack up overtime if they stay
  // late enough to cover the full expected duration and then some.
  const overtimeMinutes = Math.max(0, grossMinutes - expectedMinutes)

  const minimumMinutesForPresent = (shiftDay.minimumHoursForPresent ?? 0) * 60

  let status: AttendanceDailyStatus = 'PRESENT'
  if (workedMinutes < minimumMinutesForPresent) {
    status = 'HALF_DAY'
  } else if (lateMinutes > 0) {
    status = 'LATE'
  }

  return {
    status,
    workedMinutes,
    lateMinutes,
    earlyOutMinutes,
    overtimeMinutes,
  }
}

// Records with LATE/HALF_DAY/HOLIDAY/WEEKEND are the *result* of Present
// being auto-adjusted — the form itself always starts from one of the
// three selectable options.
const toFormStatus = (
  status: AttendanceDailyStatus
): 'PRESENT' | 'ABSENT' | 'ON_LEAVE' => {
  if (status === 'ABSENT' || status === 'ON_LEAVE') return status
  return 'PRESENT'
}

type EditFormState = {
  firstIn: string
  lastOut: string
  status: 'PRESENT' | 'ABSENT' | 'ON_LEAVE' | ''
}

const emptyEditForm: EditFormState = {
  firstIn: '',
  lastOut: '',
  status: '',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ManualAttendanceDailyApply = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: attendanceRes } = useGetAllAttendanceDailyByUserId(
    userData?.userId ?? 0
  )
  const { data: appliesRes } = useGetAllAttendanceDailyApplyByUserId(
    userData?.userId ?? 0
  )
  const { data: weekDaysRes } = useGetEmployeeWeekDays(userData?.userId ?? 0)

  const applyMutation = useAddManualAttendanceDailyApply()

  const weekDays = useMemo<EmployeeWeekDay[]>(
    () => (weekDaysRes as { data: EmployeeWeekDay[] } | undefined)?.data ?? [],
    [weekDaysRes]
  )

  // -------------------------------------------------------------------
  // Active tab (drives which search box shows in the header)
  // -------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'attendances' | 'applied'>(
    'attendances'
  )

  // -------------------------------------------------------------------
  // Attendances tab state
  // -------------------------------------------------------------------
  const [attSearch, setAttSearch] = useState('')
  const [attPage, setAttPage] = useState(1)
  const [attSortCol, setAttSortCol] =
    useState<keyof GetAttendanceDailyType>('attendanceDate')
  const [attSortDir, setAttSortDir] = useState<'asc' | 'desc'>('desc')
  const itemsPerPage = 10

  // -------------------------------------------------------------------
  // Applied Attendances tab state
  // -------------------------------------------------------------------
  const [applySearch, setApplySearch] = useState('')
  const [applyPage, setApplyPage] = useState(1)
  const [applySortCol, setApplySortCol] =
    useState<keyof GetAttendanceDailyApplyType>('attendanceDate')
  const [applySortDir, setApplySortDir] = useState<'asc' | 'desc'>('desc')

  // -------------------------------------------------------------------
  // Edit & Apply (update) popup
  // -------------------------------------------------------------------
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<GetAttendanceDailyType | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm)
  const [editError, setEditError] = useState<string | null>(null)

  const openEditPopup = useCallback((record: GetAttendanceDailyType) => {
    setEditingRecord(record)
    setEditForm({
      firstIn: toTimeInputValue(record.firstIn),
      lastOut: toTimeInputValue(record.lastOut),
      status: toFormStatus(record.status),
    })
    setEditError(null)
    setIsEditOpen(true)
  }, [])

  const closeEditPopup = useCallback(() => {
    setIsEditOpen(false)
    setEditingRecord(null)
    setEditForm(emptyEditForm)
    setEditError(null)
  }, [])

  // Shift config for the weekday of the record being edited.
  const editingShiftDay = useMemo(() => {
    if (!editingRecord || !weekDays?.length) return undefined
    const wid = getWeekDayIdForDate(new Date(editingRecord.attendanceDate))
    return weekDays?.find((w) => w.weekDayId === wid)
  }, [editingRecord, weekDays])

  // Live preview of what will actually get saved when status is Present.
  const editPreview = useMemo<AttendanceOutcome | null>(() => {
    if (editForm.status !== 'PRESENT') return null
    if (!editForm.firstIn || !editForm.lastOut) return null
    return computeAttendanceOutcome(
      editForm.firstIn,
      editForm.lastOut,
      editingShiftDay
    )
  }, [editForm.status, editForm.firstIn, editForm.lastOut, editingShiftDay])

  const handleEditSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setEditError(null)

      if (!editingRecord) return
      if (!editForm.status) {
        setEditError('Please select a status.')
        return
      }

      const dateStr = toDateInputValue(editingRecord.attendanceDate)

      let finalStatus: AttendanceDailyStatus = editForm.status
      let workedMinutes = 0
      let lateMinutes = 0
      let earlyOutMinutes = 0
      let overtimeMinutes = 0
      let firstInValue: string | null = null
      let lastOutValue: string | null = null

      if (editForm.status === 'PRESENT') {
        if (!editForm.firstIn || !editForm.lastOut) {
          setEditError(
            'First In and Last Out are required when marking Present.'
          )
          return
        }

        const outcome = computeAttendanceOutcome(
          editForm.firstIn,
          editForm.lastOut,
          editingShiftDay
        )
        finalStatus = outcome.status
        workedMinutes = outcome.workedMinutes
        lateMinutes = outcome.lateMinutes
        earlyOutMinutes = outcome.earlyOutMinutes
        overtimeMinutes = outcome.overtimeMinutes
        firstInValue = combineDateTime(dateStr, editForm.firstIn)
        lastOutValue = combineDateTime(dateStr, editForm.lastOut)
      }

      const payload: CreateAttendanceDailyApplyType = {
        employeeId: userData?.userId ?? 0,
        attendanceDate: dateStr,
        firstIn: firstInValue,
        lastOut: lastOutValue,
        workedMinutes,
        lateMinutes,
        earlyOutMinutes,
        overtimeMinutes,
        status: finalStatus,
        applyType: 'UPDATE',
        applyStatus: 'Pending',
        createdBy: userData?.userId ?? 0,
      }

      applyMutation.mutate(
        { id: editingRecord.id, data: payload },
        { onSuccess: closeEditPopup }
      )
    },
    [
      editForm,
      editingRecord,
      editingShiftDay,
      applyMutation,
      closeEditPopup,
      userData?.userId,
    ]
  )

  // -------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------
  const attendances = useMemo<GetAttendanceDailyType[]>(
    () => attendanceRes?.data ?? [],
    [attendanceRes]
  )
  const applies = useMemo<GetAttendanceDailyApplyType[]>(
    () => appliesRes?.data ?? [],
    [appliesRes]
  )

  // attendanceDailyIds that already have a pending UPDATE apply — their
  // Edit button gets disabled so a user can't submit two updates at once.
  const appliedUpdateIds = useMemo(() => {
    return new Set(
      applies
        .filter((a) => a.applyType === 'UPDATE' && a.applyStatus === 'Pending')
        .map((a) => a.attendanceDailyId)
    )
  }, [applies])

  const filteredAttendances = useMemo(() => {
    const term = attSearch.toLowerCase()
    return attendances.filter(
      (a) =>
        String(a.attendanceDate).toLowerCase().includes(term) ||
        statusLabel(a.status).toLowerCase().includes(term)
    )
  }, [attendances, attSearch])

  const sortedAttendances = useMemo(() => {
    return [...filteredAttendances].sort((a, b) => {
      const av = String(a[attSortCol] ?? '')
      const bv = String(b[attSortCol] ?? '')
      return attSortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [filteredAttendances, attSortCol, attSortDir])

  const paginatedAttendances = useMemo(() => {
    const start = (attPage - 1) * itemsPerPage
    return sortedAttendances.slice(start, start + itemsPerPage)
  }, [sortedAttendances, attPage])

  const attTotalPages = Math.ceil(sortedAttendances.length / itemsPerPage)

  const handleAttSort = (col: keyof GetAttendanceDailyType) => {
    if (col === attSortCol) setAttSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setAttSortCol(col)
      setAttSortDir('asc')
    }
  }

  const filteredApplies = useMemo(() => {
    const term = applySearch.toLowerCase()
    return applies.filter(
      (a) =>
        String(a.attendanceDate).toLowerCase().includes(term) ||
        statusLabel(a.status).toLowerCase().includes(term) ||
        a.applyStatus.toLowerCase().includes(term)
    )
  }, [applies, applySearch])

  const sortedApplies = useMemo(() => {
    return [...filteredApplies].sort((a, b) => {
      const av = String(a[applySortCol] ?? '')
      const bv = String(b[applySortCol] ?? '')
      return applySortDir === 'asc'
        ? av.localeCompare(bv)
        : bv.localeCompare(av)
    })
  }, [filteredApplies, applySortCol, applySortDir])

  const paginatedApplies = useMemo(() => {
    const start = (applyPage - 1) * itemsPerPage
    return sortedApplies.slice(start, start + itemsPerPage)
  }, [sortedApplies, applyPage])

  const applyTotalPages = Math.ceil(sortedApplies.length / itemsPerPage)

  const handleApplySort = (col: keyof GetAttendanceDailyApplyType) => {
    if (col === applySortCol)
      setApplySortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setApplySortCol(col)
      setApplySortDir('asc')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-md">
            <CalendarClock className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">My Attendance</h2>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          {activeTab === 'attendances' ? (
            <Input
              placeholder="Search..."
              value={attSearch}
              onChange={(e) => {
                setAttSearch(e.target.value)
                setAttPage(1)
              }}
              className="pl-10 w-56"
            />
          ) : (
            <Input
              placeholder="Search..."
              value={applySearch}
              onChange={(e) => {
                setApplySearch(e.target.value)
                setApplyPage(1)
              }}
              className="pl-10 w-56"
            />
          )}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'attendances' | 'applied')}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="attendances">Attendances</TabsTrigger>
          <TabsTrigger value="applied">Applied Attendances</TabsTrigger>
        </TabsList>

        {/* ----------------------------------------------------------- */}
        {/* Attendances tab                                              */}
        {/* ----------------------------------------------------------- */}
        <TabsContent value="attendances" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-blue-100">
                <TableRow>
                  <TableHead>Sl No.</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleAttSort('attendanceDate')}
                  >
                    Date <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead>First In</TableHead>
                  <TableHead>Last Out</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleAttSort('status')}
                  >
                    Status <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!attendanceRes ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : paginatedAttendances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAttendances.map((a, i) => {
                    const disabled = appliedUpdateIds.has(a.id)
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          {(attPage - 1) * itemsPerPage + i + 1}
                        </TableCell>
                        <TableCell>
                          {String(a.attendanceDate).split('T')[0]}
                        </TableCell>
                        <TableCell>
                          {a.firstIn ? toTimeInputValue(a.firstIn) : '—'}
                        </TableCell>
                        <TableCell>
                          {a.lastOut ? toTimeInputValue(a.lastOut) : '—'}
                        </TableCell>
                        <TableCell>{attendanceStatusBadge(a.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={disabled}
                            onClick={() => openEditPopup(a)}
                            title={
                              disabled
                                ? 'You have already applied for this attendance'
                                : 'Apply for update'
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {attTotalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setAttPage((p) => Math.max(p - 1, 1))}
                    className={
                      attPage === 1 ? 'pointer-events-none opacity-50' : ''
                    }
                  />
                </PaginationItem>
                {[...Array(attTotalPages)].map((_, idx) => (
                  <PaginationItem key={idx}>
                    <PaginationLink
                      onClick={() => setAttPage(idx + 1)}
                      isActive={attPage === idx + 1}
                    >
                      {idx + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setAttPage((p) => Math.min(p + 1, attTotalPages))
                    }
                    className={
                      attPage === attTotalPages
                        ? 'pointer-events-none opacity-50'
                        : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>

        {/* ----------------------------------------------------------- */}
        {/* Applied Attendances tab                                      */}
        {/* ----------------------------------------------------------- */}
        <TabsContent value="applied" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-blue-100">
                <TableRow>
                  <TableHead>Sl No.</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleApplySort('attendanceDate')}
                  >
                    Date <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead>First In</TableHead>
                  <TableHead>Last Out</TableHead>
                  <TableHead>Overtime (Minutes)</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleApplySort('status')}
                  >
                    Status <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead>Apply Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!appliesRes ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : paginatedApplies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedApplies.map((a, i) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        {(applyPage - 1) * itemsPerPage + i + 1}
                      </TableCell>
                      <TableCell>
                        {String(a.attendanceDate).split('T')[0]}
                      </TableCell>
                      <TableCell>
                        {a.firstIn ? toTimeInputValue(a.firstIn) : '—'}
                      </TableCell>
                      <TableCell>
                        {a.lastOut ? toTimeInputValue(a.lastOut) : '—'}
                      </TableCell>
                      <TableCell>{a.overtimeMinutes}</TableCell>
                      <TableCell>{attendanceStatusBadge(a.status)}</TableCell>
                      <TableCell>{applyStatusBadge(a.applyStatus)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {applyTotalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setApplyPage((p) => Math.max(p - 1, 1))}
                    className={
                      applyPage === 1 ? 'pointer-events-none opacity-50' : ''
                    }
                  />
                </PaginationItem>
                {[...Array(applyTotalPages)].map((_, idx) => (
                  <PaginationItem key={idx}>
                    <PaginationLink
                      onClick={() => setApplyPage(idx + 1)}
                      isActive={applyPage === idx + 1}
                    >
                      {idx + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setApplyPage((p) => Math.min(p + 1, applyTotalPages))
                    }
                    className={
                      applyPage === applyTotalPages
                        ? 'pointer-events-none opacity-50'
                        : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit & Apply (update) Popup */}
      <Popup
        isOpen={isEditOpen}
        onClose={closeEditPopup}
        title="Apply for Update"
        size="sm:max-w-md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={
                  editingRecord
                    ? toDateInputValue(editingRecord.attendanceDate)
                    : ''
                }
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Status <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={FORM_STATUS_OPTIONS}
                value={
                  editForm.status
                    ? {
                        id: editForm.status,
                        name: statusLabel(editForm.status),
                      }
                    : null
                }
                onChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    status:
                      (value?.id as 'PRESENT' | 'ABSENT' | 'ON_LEAVE') ?? '',
                  }))
                }
                placeholder="Select status"
              />
            </div>

            {editForm.status === 'PRESENT' && (
              <>
                <div className="space-y-2">
                  <Label>
                    First In <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={editForm.firstIn}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        firstIn: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Last Out <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={editForm.lastOut}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        lastOut: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                {editingShiftDay && (
                  <p className="text-xs text-muted-foreground">
                    Shift for {editingShiftDay.day}: {editingShiftDay.startTime}
                    –{editingShiftDay.endTime} ({editingShiftDay.dayType})
                  </p>
                )}

                {editPreview && (
                  <div className="text-sm rounded-md border p-2 flex items-center gap-2">
                    <span className="text-muted-foreground">
                      Will be recorded as:
                    </span>
                    {attendanceStatusBadge(editPreview.status)}
                  </div>
                )}
              </>
            )}
          </div>

          {editError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {editError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeEditPopup}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                applyMutation.isPending ||
                (editingRecord ? appliedUpdateIds.has(editingRecord.id) : false)
              }
            >
              {applyMutation.isPending
                ? 'Submitting...'
                : editingRecord && appliedUpdateIds.has(editingRecord.id)
                  ? 'Update Already Pending'
                  : 'Submit'}
            </Button>
          </div>
        </form>
      </Popup>
    </div>
  )
}

export default ManualAttendanceDailyApply
