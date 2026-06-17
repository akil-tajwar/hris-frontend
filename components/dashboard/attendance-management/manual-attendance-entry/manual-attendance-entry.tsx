'use client'

import type React from 'react'
import { useMemo, useState } from 'react'
import { useAtom } from 'jotai'
import { Plus, Pencil, Trash2, Loader2, ClipboardList, X } from 'lucide-react'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

import { useInitializeUser, userDataAtom } from '@/utils/user'
import {
  useGetAllAttendanceDaily,
  useAddAttendanceDaily,
  useUpdateAttendanceDaily,
  useDeleteAttendanceDaily,
  useGetAllEmployees,
} from '@/hooks/use-api'
import type {
  AttendanceDailyStatus,
  GetAttendanceDailyType,
} from '@/utils/type'

const STATUS_OPTIONS: AttendanceDailyStatus[] = [
  'PRESENT',
  'LATE',
  'HALF_DAY',
  'ABSENT',
  'HOLIDAY',
  'WEEKEND',
  'ON_LEAVE',
]

// status গুলোতে time field দরকার নেই
const NO_TIME_STATUSES: AttendanceDailyStatus[] = [
  'ABSENT',
  'HOLIDAY',
  'WEEKEND',
  'ON_LEAVE',
]

const PAGE_SIZE = 15

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-700',
    LATE: 'bg-yellow-100 text-yellow-700',
    HALF_DAY: 'bg-orange-100 text-orange-700',
    ABSENT: 'bg-red-100 text-red-600',
    HOLIDAY: 'bg-purple-100 text-purple-700',
    WEEKEND: 'bg-blue-100 text-blue-600',
    ON_LEAVE: 'bg-teal-100 text-teal-700',
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        map[status] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

// ── time <-> date helpers (browser local time ব্যবহার করে, backend timestamp এর সাথে consistent) ──
const toTimeInputValue = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

const toIsoFromDateTime = (date: string, time: string) => {
  if (!date || !time) return null
  const [hh, mm] = time.split(':').map(Number)
  const d = new Date(date)
  d.setHours(hh, mm, 0, 0)
  return d.toISOString()
}

const computeWorkedMinutes = (firstIn: string | null, lastOut: string | null) => {
  if (!firstIn || !lastOut) return 0
  const diff = new Date(lastOut).getTime() - new Date(firstIn).getTime()
  return diff > 0 ? Math.round(diff / 60000) : 0
}

const formatTime = (val: string | null) => {
  if (!val) return '—'
  return new Date(val).toLocaleTimeString('en-BD', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

type FormState = {
  employeeId: string
  attendanceDate: string
  status: AttendanceDailyStatus
  firstInTime: string
  lastOutTime: string
  lateMinutes: string
  earlyOutMinutes: string
  overtimeMinutes: string
}

const emptyForm: FormState = {
  employeeId: '',
  attendanceDate: '',
  status: 'PRESENT',
  firstInTime: '',
  lastOutTime: '',
  lateMinutes: '0',
  earlyOutMinutes: '0',
  overtimeMinutes: '0',
}

const ManualAttendanceEntry = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const currentUserId = Number((userData as any)?.userId) || 1

  const { data: attendanceRes, isLoading } = useGetAllAttendanceDaily()
  const { data: employeesRes } = useGetAllEmployees()

  const records: GetAttendanceDailyType[] = useMemo(
    () => attendanceRes?.data ?? [],
    [attendanceRes?.data]
  )
  const employees = useMemo(() => employeesRes?.data ?? [], [employeesRes?.data])

  // ── create/edit dialog state ──
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  // ── delete confirmation dialog state ──
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const resetForm = () => setForm(emptyForm)

  const addMutation = useAddAttendanceDaily({
    onClose: () => setDialogOpen(false),
    reset: resetForm,
  })
  const updateMutation = useUpdateAttendanceDaily({
    onClose: () => setDialogOpen(false),
    reset: resetForm,
  })
  const deleteMutation = useDeleteAttendanceDaily({
    onClose: () => setDeleteId(null),
    reset: () => {},
  })

  // ── filters ──
  const [filterEmployeeId, setFilterEmployeeId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFromDate, setFilterFromDate] = useState('')
  const [filterToDate, setFilterToDate] = useState('')
  const [page, setPage] = useState(1)

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterEmployeeId && r.employeeId !== Number(filterEmployeeId)) return false
      if (filterStatus && r.status !== filterStatus) return false
      const dateOnly = r.attendanceDate.slice(0, 10)
      if (filterFromDate && dateOnly < filterFromDate) return false
      if (filterToDate && dateOnly > filterToDate) return false
      return true
    })
  }, [records, filterEmployeeId, filterStatus, filterFromDate, filterToDate])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE))
  const paginatedRecords = useMemo(
    () => filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRecords, page]
  )

  const handleResetFilters = () => {
    setFilterEmployeeId('')
    setFilterStatus('')
    setFilterFromDate('')
    setFilterToDate('')
    setPage(1)
  }

  // ── open dialog for create ──
  const openCreateDialog = () => {
    setEditingId(null)
    resetForm()
    setDialogOpen(true)
  }

  // ── open dialog for edit ──
  const openEditDialog = (record: GetAttendanceDailyType) => {
    setEditingId(record.id)
    setForm({
      employeeId: String(record.employeeId),
      attendanceDate: record.attendanceDate.slice(0, 10),
      status: record.status,
      firstInTime: toTimeInputValue(record.firstIn),
      lastOutTime: toTimeInputValue(record.lastOut),
      lateMinutes: String(record.lateMinutes ?? 0),
      earlyOutMinutes: String(record.earlyOutMinutes ?? 0),
      overtimeMinutes: String(record.overtimeMinutes ?? 0),
    })
    setDialogOpen(true)
  }

  const needsTime = !NO_TIME_STATUSES.includes(form.status)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employeeId || !form.attendanceDate || !form.status) return

    const firstIn = needsTime ? toIsoFromDateTime(form.attendanceDate, form.firstInTime) : null
    const lastOut = needsTime ? toIsoFromDateTime(form.attendanceDate, form.lastOutTime) : null
    const workedMinutes = needsTime ? computeWorkedMinutes(firstIn, lastOut) : 0

    const payload = {
      employeeId: Number(form.employeeId),
      attendanceDate: form.attendanceDate,
      status: form.status,
      firstIn,
      lastOut,
      workedMinutes,
      lateMinutes: Number(form.lateMinutes) || 0,
      earlyOutMinutes: Number(form.earlyOutMinutes) || 0,
      overtimeMinutes: Number(form.overtimeMinutes) || 0,
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: { ...payload, updatedBy: currentUserId },
      })
    } else {
      addMutation.mutate({ ...payload, createdBy: currentUserId })
    }
  }

  // ── delete handlers ──
  const handleDelete = (id: number) => {
    setDeleteId(id)
  }

  const confirmDelete = () => {
    if (deleteId === null) return
    deleteMutation.mutate({ id: deleteId })
  }

  const isSaving = addMutation.isPending || updateMutation.isPending

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-md">
            <ClipboardList className="text-blue-600 h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">Manual Attendance Entry</h2>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Entry
        </Button>
      </div>

      {/* Filters */}
      <div className="border rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">Filters</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Employee</Label>
            <Select
              value={filterEmployeeId || 'all'}
              onValueChange={(v) => {
                setFilterEmployeeId(v === 'all' ? '' : v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-48 h-8 text-sm">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.employeeId} value={String(emp.employeeId)}>
                    {emp.empFullName} ({emp.empCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Status</Label>
            <Select
              value={filterStatus || 'all'}
              onValueChange={(v) => {
                setFilterStatus(v === 'all' ? '' : v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-gray-500">From Date</Label>
            <Input
              type="date"
              value={filterFromDate}
              onChange={(e) => {
                setFilterFromDate(e.target.value)
                setPage(1)
              }}
              className="w-40 h-8 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-gray-500">To Date</Label>
            <Input
              type="date"
              value={filterToDate}
              onChange={(e) => {
                setFilterToDate(e.target.value)
                setPage(1)
              }}
              className="w-40 h-8 text-sm"
            />
          </div>

          <Button size="sm" variant="outline" onClick={handleResetFilters} className="h-8">
            <X className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        </div>
        <p className="text-xs text-gray-500">{filteredRecords.length} records found</p>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>First In</TableHead>
              <TableHead>Last Out</TableHead>
              <TableHead>Worked</TableHead>
              <TableHead>Late</TableHead>
              <TableHead>Early Out</TableHead>
              <TableHead>OT</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-500" />
                </TableCell>
              </TableRow>
            ) : paginatedRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-gray-400">
                  No attendance records found
                </TableCell>
              </TableRow>
            ) : (
              paginatedRecords.map((r, index) => (
                <TableRow key={r.id}>
                  <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{r.employeeName ?? '—'}</p>
                      <p className="text-xs text-gray-400">{r.empCode}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{r.attendanceDate.slice(0, 10)}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatTime(r.firstIn)}</TableCell>
                  <TableCell className="text-xs text-gray-500">{formatTime(r.lastOut)}</TableCell>
                  <TableCell className="text-xs text-gray-500">{r.workedMinutes ?? 0}m</TableCell>
                  <TableCell className="text-xs text-gray-500">{r.lateMinutes ?? 0}m</TableCell>
                  <TableCell className="text-xs text-gray-500">{r.earlyOutMinutes ?? 0}m</TableCell>
                  <TableCell className="text-xs text-gray-500">{r.overtimeMinutes ?? 0}m</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(r)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(r.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
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
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink onClick={() => setPage(i + 1)} isActive={page === i + 1}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Attendance Record' : 'Add Manual Attendance Entry'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Employee</Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => setForm((f) => ({ ...f, employeeId: v }))}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.employeeId} value={String(emp.employeeId)}>
                      {emp.empFullName} ({emp.empCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.attendanceDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, attendanceDate: e.target.value }))
                  }
                  required
                  disabled={!!editingId}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as AttendanceDailyStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {needsTime && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>First In</Label>
                  <Input
                    type="time"
                    value={form.firstInTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstInTime: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Last Out</Label>
                  <Input
                    type="time"
                    value={form.lastOutTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lastOutTime: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            {needsTime && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Late (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.lateMinutes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lateMinutes: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Early Out (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.earlyOutMinutes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, earlyOutMinutes: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">OT (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.overtimeMinutes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, overtimeMinutes: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  'Update'
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Attendance Record</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-500">
            এই attendance record টা delete করতে চাও? এই action আর ফিরিয়ে নেওয়া যাবে না।
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManualAttendanceEntry



// 'use client'

// import type React from 'react'
// import { useMemo, useState } from 'react'
// import { useAtom } from 'jotai'
// import { Plus, Pencil, Trash2, Loader2, ClipboardList, X } from 'lucide-react'

// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog'
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
// } from '@/components/ui/pagination'

// import { useInitializeUser, userDataAtom } from '@/utils/user'
// import {
//   useGetAllAttendanceDaily,
//   useAddAttendanceDaily,
//   useUpdateAttendanceDaily,
//   useDeleteAttendanceDaily,
//   useGetAllEmployees,
// } from '@/hooks/use-api'
// import type {
//   AttendanceDailyStatus,
//   GetAttendanceDailyType,
// } from '@/utils/type'

// const STATUS_OPTIONS: AttendanceDailyStatus[] = [
//   'PRESENT',
//   'LATE',
//   'HALF_DAY',
//   'ABSENT',
//   'HOLIDAY',
//   'WEEKEND',
//   'ON_LEAVE',
// ]

// // status গুলোতে time field দরকার নেই
// const NO_TIME_STATUSES: AttendanceDailyStatus[] = [
//   'ABSENT',
//   'HOLIDAY',
//   'WEEKEND',
//   'ON_LEAVE',
// ]

// const PAGE_SIZE = 15

// const StatusBadge = ({ status }: { status: string }) => {
//   const map: Record<string, string> = {
//     PRESENT: 'bg-green-100 text-green-700',
//     LATE: 'bg-yellow-100 text-yellow-700',
//     HALF_DAY: 'bg-orange-100 text-orange-700',
//     ABSENT: 'bg-red-100 text-red-600',
//     HOLIDAY: 'bg-purple-100 text-purple-700',
//     WEEKEND: 'bg-blue-100 text-blue-600',
//     ON_LEAVE: 'bg-teal-100 text-teal-700',
//   }
//   return (
//     <span
//       className={`px-2 py-0.5 rounded-full text-xs font-medium ${
//         map[status] ?? 'bg-gray-100 text-gray-600'
//       }`}
//     >
//       {status.replace('_', ' ')}
//     </span>
//   )
// }

// // ── time <-> date helpers (browser local time ব্যবহার করে, backend timestamp এর সাথে consistent) ──
// const toTimeInputValue = (iso: string | null) => {
//   if (!iso) return ''
//   const d = new Date(iso)
//   const hh = String(d.getHours()).padStart(2, '0')
//   const mm = String(d.getMinutes()).padStart(2, '0')
//   return `${hh}:${mm}`
// }

// const toIsoFromDateTime = (date: string, time: string) => {
//   if (!date || !time) return null
//   const [hh, mm] = time.split(':').map(Number)
//   const d = new Date(date)
//   d.setHours(hh, mm, 0, 0)
//   return d.toISOString()
// }

// const computeWorkedMinutes = (firstIn: string | null, lastOut: string | null) => {
//   if (!firstIn || !lastOut) return 0
//   const diff = new Date(lastOut).getTime() - new Date(firstIn).getTime()
//   return diff > 0 ? Math.round(diff / 60000) : 0
// }

// const formatTime = (val: string | null) => {
//   if (!val) return '—'
//   return new Date(val).toLocaleTimeString('en-BD', {
//     hour: '2-digit',
//     minute: '2-digit',
//   })
// }

// type FormState = {
//   employeeId: string
//   attendanceDate: string
//   status: AttendanceDailyStatus
//   firstInTime: string
//   lastOutTime: string
//   lateMinutes: string
//   earlyOutMinutes: string
//   overtimeMinutes: string
// }

// const emptyForm: FormState = {
//   employeeId: '',
//   attendanceDate: '',
//   status: 'PRESENT',
//   firstInTime: '',
//   lastOutTime: '',
//   lateMinutes: '0',
//   earlyOutMinutes: '0',
//   overtimeMinutes: '0',
// }

// const ManualAttendanceEntry = () => {
//   useInitializeUser()
//   const [userData] = useAtom(userDataAtom)
//   const currentUserId = Number((userData as any)?.userId) || 1

//   const { data: attendanceRes, isLoading } = useGetAllAttendanceDaily()
//   const { data: employeesRes } = useGetAllEmployees()

//   const records: GetAttendanceDailyType[] = useMemo(
//     () => attendanceRes?.data ?? [],
//     [attendanceRes?.data]
//   )
//   const employees = useMemo(() => employeesRes?.data ?? [], [employeesRes?.data])

//   // ── dialog state ──
//   const [dialogOpen, setDialogOpen] = useState(false)
//   const [editingId, setEditingId] = useState<number | null>(null)
//   const [form, setForm] = useState<FormState>(emptyForm)

//   const resetForm = () => setForm(emptyForm)

//   const addMutation = useAddAttendanceDaily({
//     onClose: () => setDialogOpen(false),
//     reset: resetForm,
//   })
//   const updateMutation = useUpdateAttendanceDaily({
//     onClose: () => setDialogOpen(false),
//     reset: resetForm,
//   })
//   const deleteMutation = useDeleteAttendanceDaily({
//     onClose: () => {},
//     reset: () => {},
//   })

//   // ── filters ──
//   const [filterEmployeeId, setFilterEmployeeId] = useState('')
//   const [filterStatus, setFilterStatus] = useState('')
//   const [filterFromDate, setFilterFromDate] = useState('')
//   const [filterToDate, setFilterToDate] = useState('')
//   const [page, setPage] = useState(1)

//   const filteredRecords = useMemo(() => {
//     return records.filter((r) => {
//       if (filterEmployeeId && r.employeeId !== Number(filterEmployeeId)) return false
//       if (filterStatus && r.status !== filterStatus) return false
//       const dateOnly = r.attendanceDate.slice(0, 10)
//       if (filterFromDate && dateOnly < filterFromDate) return false
//       if (filterToDate && dateOnly > filterToDate) return false
//       return true
//     })
//   }, [records, filterEmployeeId, filterStatus, filterFromDate, filterToDate])

//   const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE))
//   const paginatedRecords = useMemo(
//     () => filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
//     [filteredRecords, page]
//   )

//   const handleResetFilters = () => {
//     setFilterEmployeeId('')
//     setFilterStatus('')
//     setFilterFromDate('')
//     setFilterToDate('')
//     setPage(1)
//   }

//   // ── open dialog for create ──
//   const openCreateDialog = () => {
//     setEditingId(null)
//     resetForm()
//     setDialogOpen(true)
//   }

//   // ── open dialog for edit ──
//   const openEditDialog = (record: GetAttendanceDailyType) => {
//     setEditingId(record.id)
//     setForm({
//       employeeId: String(record.employeeId),
//       attendanceDate: record.attendanceDate.slice(0, 10),
//       status: record.status,
//       firstInTime: toTimeInputValue(record.firstIn),
//       lastOutTime: toTimeInputValue(record.lastOut),
//       lateMinutes: String(record.lateMinutes ?? 0),
//       earlyOutMinutes: String(record.earlyOutMinutes ?? 0),
//       overtimeMinutes: String(record.overtimeMinutes ?? 0),
//     })
//     setDialogOpen(true)
//   }

//   const needsTime = !NO_TIME_STATUSES.includes(form.status)

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!form.employeeId || !form.attendanceDate || !form.status) return

//     const firstIn = needsTime ? toIsoFromDateTime(form.attendanceDate, form.firstInTime) : null
//     const lastOut = needsTime ? toIsoFromDateTime(form.attendanceDate, form.lastOutTime) : null
//     const workedMinutes = needsTime ? computeWorkedMinutes(firstIn, lastOut) : 0

//     const payload = {
//       employeeId: Number(form.employeeId),
//       attendanceDate: form.attendanceDate,
//       status: form.status,
//       firstIn,
//       lastOut,
//       workedMinutes,
//       lateMinutes: Number(form.lateMinutes) || 0,
//       earlyOutMinutes: Number(form.earlyOutMinutes) || 0,
//       overtimeMinutes: Number(form.overtimeMinutes) || 0,
//     }

//     if (editingId) {
//       updateMutation.mutate({
//         id: editingId,
//         data: { ...payload, updatedBy: currentUserId },
//       })
//     } else {
//       addMutation.mutate({ ...payload, createdBy: currentUserId })
//     }
//   }

//   const handleDelete = (id: number) => {
//     if (!window.confirm('এই attendance record টা delete করতে চাও?')) return
//     deleteMutation.mutate({ id })
//   }

//   const isSaving = addMutation.isPending || updateMutation.isPending

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <div className="bg-blue-100 p-2 rounded-md">
//             <ClipboardList className="text-blue-600 h-5 w-5" />
//           </div>
//           <h2 className="text-lg font-semibold">Manual Attendance Entry</h2>
//         </div>
//         <Button
//           onClick={openCreateDialog}
//           className="bg-blue-500 hover:bg-blue-600 text-white"
//         >
//           <Plus className="h-4 w-4 mr-1" />
//           Add Entry
//         </Button>
//       </div>

//       {/* Filters */}
//       <div className="border rounded-lg p-4 space-y-3">
//         <p className="text-sm font-medium text-gray-700">Filters</p>
//         <div className="flex flex-wrap gap-3 items-end">
//           <div className="space-y-1">
//             <Label className="text-xs text-gray-500">Employee</Label>
//             <Select
//               value={filterEmployeeId || 'all'}
//               onValueChange={(v) => {
//                 setFilterEmployeeId(v === 'all' ? '' : v)
//                 setPage(1)
//               }}
//             >
//               <SelectTrigger className="w-48 h-8 text-sm">
//                 <SelectValue placeholder="All employees" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All employees</SelectItem>
//                 {employees.map((emp) => (
//                   <SelectItem key={emp.employeeId} value={String(emp.employeeId)}>
//                     {emp.empFullName} ({emp.empCode})
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="space-y-1">
//             <Label className="text-xs text-gray-500">Status</Label>
//             <Select
//               value={filterStatus || 'all'}
//               onValueChange={(v) => {
//                 setFilterStatus(v === 'all' ? '' : v)
//                 setPage(1)
//               }}
//             >
//               <SelectTrigger className="w-36 h-8 text-sm">
//                 <SelectValue placeholder="All" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All</SelectItem>
//                 {STATUS_OPTIONS.map((s) => (
//                   <SelectItem key={s} value={s}>
//                     {s.replace('_', ' ')}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="space-y-1">
//             <Label className="text-xs text-gray-500">From Date</Label>
//             <Input
//               type="date"
//               value={filterFromDate}
//               onChange={(e) => {
//                 setFilterFromDate(e.target.value)
//                 setPage(1)
//               }}
//               className="w-40 h-8 text-sm"
//             />
//           </div>

//           <div className="space-y-1">
//             <Label className="text-xs text-gray-500">To Date</Label>
//             <Input
//               type="date"
//               value={filterToDate}
//               onChange={(e) => {
//                 setFilterToDate(e.target.value)
//                 setPage(1)
//               }}
//               className="w-40 h-8 text-sm"
//             />
//           </div>

//           <Button size="sm" variant="outline" onClick={handleResetFilters} className="h-8">
//             <X className="h-3.5 w-3.5 mr-1" />
//             Reset
//           </Button>
//         </div>
//         <p className="text-xs text-gray-500">{filteredRecords.length} records found</p>
//       </div>

//       {/* Table */}
//       <div className="rounded-md border">
//         <Table>
//           <TableHeader className="bg-blue-100">
//             <TableRow>
//               <TableHead>Sl No.</TableHead>
//               <TableHead>Employee</TableHead>
//               <TableHead>Date</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead>First In</TableHead>
//               <TableHead>Last Out</TableHead>
//               <TableHead>Worked</TableHead>
//               <TableHead>Late</TableHead>
//               <TableHead>Early Out</TableHead>
//               <TableHead>OT</TableHead>
//               <TableHead className="text-right">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {isLoading ? (
//               <TableRow>
//                 <TableCell colSpan={11} className="text-center py-8">
//                   <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-500" />
//                 </TableCell>
//               </TableRow>
//             ) : paginatedRecords.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={11} className="text-center py-8 text-gray-400">
//                   No attendance records found
//                 </TableCell>
//               </TableRow>
//             ) : (
//               paginatedRecords.map((r, index) => (
//                 <TableRow key={r.id}>
//                   <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
//                   <TableCell>
//                     <div>
//                       <p className="text-sm font-medium">{r.employeeName ?? '—'}</p>
//                       <p className="text-xs text-gray-400">{r.empCode}</p>
//                     </div>
//                   </TableCell>
//                   <TableCell className="text-sm">{r.attendanceDate.slice(0, 10)}</TableCell>
//                   <TableCell>
//                     <StatusBadge status={r.status} />
//                   </TableCell>
//                   <TableCell className="text-xs text-gray-500">{formatTime(r.firstIn)}</TableCell>
//                   <TableCell className="text-xs text-gray-500">{formatTime(r.lastOut)}</TableCell>
//                   <TableCell className="text-xs text-gray-500">{r.workedMinutes ?? 0}m</TableCell>
//                   <TableCell className="text-xs text-gray-500">{r.lateMinutes ?? 0}m</TableCell>
//                   <TableCell className="text-xs text-gray-500">{r.earlyOutMinutes ?? 0}m</TableCell>
//                   <TableCell className="text-xs text-gray-500">{r.overtimeMinutes ?? 0}m</TableCell>
//                   <TableCell className="text-right">
//                     <Button
//                       size="icon"
//                       variant="ghost"
//                       onClick={() => openEditDialog(r)}
//                       className="h-8 w-8"
//                     >
//                       <Pencil className="h-4 w-4 text-blue-600" />
//                     </Button>
//                     <Button
//                       size="icon"
//                       variant="ghost"
//                       onClick={() => handleDelete(r.id)}
//                       className="h-8 w-8"
//                     >
//                       <Trash2 className="h-4 w-4 text-red-500" />
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </div>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <Pagination>
//           <PaginationContent>
//             <PaginationItem>
//               <PaginationPrevious
//                 onClick={() => setPage((p) => Math.max(p - 1, 1))}
//                 className={page === 1 ? 'pointer-events-none opacity-50' : ''}
//               />
//             </PaginationItem>
//             {[...Array(totalPages)].map((_, i) => (
//               <PaginationItem key={i}>
//                 <PaginationLink onClick={() => setPage(i + 1)} isActive={page === i + 1}>
//                   {i + 1}
//                 </PaginationLink>
//               </PaginationItem>
//             ))}
//             <PaginationItem>
//               <PaginationNext
//                 onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
//                 className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
//               />
//             </PaginationItem>
//           </PaginationContent>
//         </Pagination>
//       )}

//       {/* Create / Edit Dialog */}
//       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>
//               {editingId ? 'Edit Attendance Record' : 'Add Manual Attendance Entry'}
//             </DialogTitle>
//           </DialogHeader>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-1">
//               <Label>Employee</Label>
//               <Select
//                 value={form.employeeId}
//                 onValueChange={(v) => setForm((f) => ({ ...f, employeeId: v }))}
//                 disabled={!!editingId}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select employee" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {employees.map((emp) => (
//                     <SelectItem key={emp.employeeId} value={String(emp.employeeId)}>
//                       {emp.empFullName} ({emp.empCode})
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               <div className="space-y-1">
//                 <Label>Date</Label>
//                 <Input
//                   type="date"
//                   value={form.attendanceDate}
//                   onChange={(e) =>
//                     setForm((f) => ({ ...f, attendanceDate: e.target.value }))
//                   }
//                   required
//                   disabled={!!editingId}
//                 />
//               </div>
//               <div className="space-y-1">
//                 <Label>Status</Label>
//                 <Select
//                   value={form.status}
//                   onValueChange={(v) =>
//                     setForm((f) => ({ ...f, status: v as AttendanceDailyStatus }))
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {STATUS_OPTIONS.map((s) => (
//                       <SelectItem key={s} value={s}>
//                         {s.replace('_', ' ')}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             {needsTime && (
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1">
//                   <Label>First In</Label>
//                   <Input
//                     type="time"
//                     value={form.firstInTime}
//                     onChange={(e) =>
//                       setForm((f) => ({ ...f, firstInTime: e.target.value }))
//                     }
//                   />
//                 </div>
//                 <div className="space-y-1">
//                   <Label>Last Out</Label>
//                   <Input
//                     type="time"
//                     value={form.lastOutTime}
//                     onChange={(e) =>
//                       setForm((f) => ({ ...f, lastOutTime: e.target.value }))
//                     }
//                   />
//                 </div>
//               </div>
//             )}

//             {needsTime && (
//               <div className="grid grid-cols-3 gap-3">
//                 <div className="space-y-1">
//                   <Label className="text-xs">Late (min)</Label>
//                   <Input
//                     type="number"
//                     min={0}
//                     value={form.lateMinutes}
//                     onChange={(e) =>
//                       setForm((f) => ({ ...f, lateMinutes: e.target.value }))
//                     }
//                   />
//                 </div>
//                 <div className="space-y-1">
//                   <Label className="text-xs">Early Out (min)</Label>
//                   <Input
//                     type="number"
//                     min={0}
//                     value={form.earlyOutMinutes}
//                     onChange={(e) =>
//                       setForm((f) => ({ ...f, earlyOutMinutes: e.target.value }))
//                     }
//                   />
//                 </div>
//                 <div className="space-y-1">
//                   <Label className="text-xs">OT (min)</Label>
//                   <Input
//                     type="number"
//                     min={0}
//                     value={form.overtimeMinutes}
//                     onChange={(e) =>
//                       setForm((f) => ({ ...f, overtimeMinutes: e.target.value }))
//                     }
//                   />
//                 </div>
//               </div>
//             )}

//             <DialogFooter>
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setDialogOpen(false)}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 disabled={isSaving}
//                 className="bg-blue-500 hover:bg-blue-600 text-white"
//               >
//                 {isSaving ? (
//                   <>
//                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                     Saving...
//                   </>
//                 ) : editingId ? (
//                   'Update'
//                 ) : (
//                   'Save'
//                 )}
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }

// export default ManualAttendanceEntry