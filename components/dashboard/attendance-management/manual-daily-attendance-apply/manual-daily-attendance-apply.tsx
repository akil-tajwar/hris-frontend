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
import {
  ArrowUpDown,
  CalendarClock,
  ClipboardList,
  Pencil,
  Plus,
  Search,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetAllAttendanceDailyByUserId,
  useGetAllAttendanceDailyApplyByUserId,
  useAddManualAttendanceDailyApply,
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

type AddFormState = {
  attendanceDate: string
  firstIn: string
  lastOut: string
  status: AttendanceDailyStatus | ''
}

const emptyAddForm: AddFormState = {
  attendanceDate: '',
  firstIn: '',
  lastOut: '',
  status: '',
}

type EditFormState = {
  firstIn: string
  lastOut: string
  status: AttendanceDailyStatus | ''
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
  console.log("🚀 ~ ManualAttendanceDailyApply ~ attendanceRes:", attendanceRes)
  const { data: appliesRes } = useGetAllAttendanceDailyApplyByUserId(
    userData?.userId ?? 0
  )
  console.log("🚀 ~ ManualAttendanceDailyApply ~ appliesRes:", appliesRes)

  const applyMutation = useAddManualAttendanceDailyApply()

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
  // Add Attendance popup
  // -------------------------------------------------------------------
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<AddFormState>(emptyAddForm)
  const [addError, setAddError] = useState<string | null>(null)

  const closeAddPopup = useCallback(() => {
    setIsAddOpen(false)
    setAddForm(emptyAddForm)
    setAddError(null)
  }, [])

  const handleAddSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setAddError(null)

      if (!addForm.attendanceDate) {
        setAddError('Please select a date.')
        return
      }
      if (!addForm.status) {
        setAddError('Please select a status.')
        return
      }

      const payload: CreateAttendanceDailyApplyType = {
        employeeId: userData?.userId ?? 0,
        attendanceDate: addForm.attendanceDate,
        firstIn: combineDateTime(addForm.attendanceDate, addForm.firstIn),
        lastOut: combineDateTime(addForm.attendanceDate, addForm.lastOut),
        status: addForm.status,
        applyType: 'CREATE',
        applyStatus: 'Pending',
        createdBy: userData?.userId ?? 0,
      }

      applyMutation.mutate(
        { id: userData?.userId ?? 0, data: payload },
        { onSuccess: closeAddPopup }
      )
    },
    [addForm, applyMutation, closeAddPopup, userData?.userId]
  )

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
      status: record.status,
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

      const payload: CreateAttendanceDailyApplyType = {
        employeeId: userData?.userId ?? 0,
        attendanceDate: dateStr,
        firstIn: combineDateTime(dateStr, editForm.firstIn),
        lastOut: combineDateTime(dateStr, editForm.lastOut),
        status: editForm.status,
        applyType: 'UPDATE',
        applyStatus: 'Pending',
        createdBy: userData?.userId ?? 0,
      }

      applyMutation.mutate(
        { id: userData?.userId ?? 0, data: payload }, //id isn't userId. it's dailyAttendance's primary key, which is using as foreign key here
        { onSuccess: closeEditPopup }
      )
    },
    [editForm, editingRecord, applyMutation, closeEditPopup, userData?.userId]
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
  const pendingUpdateIds = useMemo(() => {
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
        <Button
          className="bg-blue-400 hover:bg-blue-500 text-black"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Attendance
        </Button>
      </div>

      <Tabs defaultValue="attendances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendances">Attendances</TabsTrigger>
          <TabsTrigger value="applied">Applied Attendances</TabsTrigger>
        </TabsList>

        {/* ----------------------------------------------------------- */}
        {/* Attendances tab                                              */}
        {/* ----------------------------------------------------------- */}
        <TabsContent value="attendances" className="space-y-4">
          <div className="flex justify-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                value={attSearch}
                onChange={(e) => {
                  setAttSearch(e.target.value)
                  setAttPage(1)
                }}
                className="pl-10 w-56"
              />
            </div>
          </div>

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
                    const disabled = pendingUpdateIds.has(a.id)
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
                                ? 'An update is already pending approval'
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
          <div className="flex justify-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                value={applySearch}
                onChange={(e) => {
                  setApplySearch(e.target.value)
                  setApplyPage(1)
                }}
                className="pl-10 w-56"
              />
            </div>
          </div>

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
                  <TableHead>Type</TableHead>
                  <TableHead>First In</TableHead>
                  <TableHead>Last Out</TableHead>
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
                      <TableCell>{applyTypeBadge(a.applyType)}</TableCell>
                      <TableCell>
                        {a.firstIn ? toTimeInputValue(a.firstIn) : '—'}
                      </TableCell>
                      <TableCell>
                        {a.lastOut ? toTimeInputValue(a.lastOut) : '—'}
                      </TableCell>
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

      {/* Add Attendance Popup */}
      <Popup
        isOpen={isAddOpen}
        onClose={closeAddPopup}
        title="Add Attendance"
        size="sm:max-w-md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={addForm.attendanceDate}
                onChange={(e) =>
                  setAddForm((prev) => ({
                    ...prev,
                    attendanceDate: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                Status <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={STATUS_OPTIONS}
                value={
                  addForm.status
                    ? { id: addForm.status, name: statusLabel(addForm.status) }
                    : null
                }
                onChange={(value) =>
                  setAddForm((prev) => ({
                    ...prev,
                    status: (value?.id as AttendanceDailyStatus) ?? '',
                  }))
                }
                placeholder="Select status"
              />
            </div>

            <div className="space-y-2">
              <Label>First In</Label>
              <Input
                type="time"
                value={addForm.firstIn}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, firstIn: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Last Out</Label>
              <Input
                type="time"
                value={addForm.lastOut}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, lastOut: e.target.value }))
                }
              />
            </div>
          </div>

          {addError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {addError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeAddPopup}>
              Cancel
            </Button>
            <Button type="submit" disabled={applyMutation.isPending}>
              {applyMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </Popup>

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
                items={STATUS_OPTIONS}
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
                    status: (value?.id as AttendanceDailyStatus) ?? '',
                  }))
                }
                placeholder="Select status"
              />
            </div>

            <div className="space-y-2">
              <Label>First In</Label>
              <Input
                type="time"
                value={editForm.firstIn}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, firstIn: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Last Out</Label>
              <Input
                type="time"
                value={editForm.lastOut}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, lastOut: e.target.value }))
                }
              />
            </div>
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
            <Button type="submit" disabled={applyMutation.isPending}>
              {applyMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </Popup>
    </div>
  )
}

export default ManualAttendanceDailyApply
