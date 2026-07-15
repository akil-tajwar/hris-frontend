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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import {
  ArrowUpDown,
  CheckCircle,
  Pencil,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetAllAttendanceDailyApply,
  useGetAllEmployees,
  useGetEmpIdByUserId,
  useEditManualAttendanceDailyApply,
  useApproveManualAttendanceByRepAuth,
  useApproveManualAttendanceByHr,
  useRejectManualAttendance,
} from '@/hooks/use-api'
import { CustomCombobox } from '@/utils/custom-combobox'
import type {
  AttendanceDailyStatus,
  GetAttendanceDailyApplyType,
} from '@/utils/type'

// ---------------------------------------------------------------------------
// NOTE: this page needs to see attendance applies across *all* employees
// (not just the signed-in user's own), so it calls a `useGetAllAttendanceDailyApply`
// hook with no userId — the same pattern `useGetEmployeeLeaveApplications` uses
// in the leave module. Rename this import if your actual hook is named
// differently.
// ---------------------------------------------------------------------------

const HR_ROLE_ID = 2

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

const applyTypeBadge = (type: 'CREATE' | 'UPDATE') =>
  type === 'CREATE' ? (
    <Badge className="bg-blue-100 text-blue-700 border-blue-200">New</Badge>
  ) : (
    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
      Update
    </Badge>
  )

const toTimeInputValue = (value: string | null) => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`
}

const combineDateTime = (date: string, time: string): string | null => {
  if (!date || !time) return null
  return `${date}T${time}:00`
}

type ChangeFormState = {
  firstIn: string
  lastOut: string
  status: AttendanceDailyStatus | ''
}

const emptyChangeForm: ChangeFormState = {
  firstIn: '',
  lastOut: '',
  status: '',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ManualAttendanceApprove = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const isHr = userData?.roleId === HR_ROLE_ID

  const { data: appliesRes } = useGetAllAttendanceDailyApply()
  const { data: empId } = useGetEmpIdByUserId(userData?.userId || 0)
  const { data: employees } = useGetAllEmployees()

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] =
    useState<keyof GetAttendanceDailyApplyType>('attendanceDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const itemsPerPage = 10

  // Change (edit-before-approve) popup
  const [isChangeOpen, setIsChangeOpen] = useState(false)
  const [changingRecord, setChangingRecord] =
    useState<GetAttendanceDailyApplyType | null>(null)
  const [changeForm, setChangeForm] = useState<ChangeFormState>(emptyChangeForm)
  const [changeError, setChangeError] = useState<string | null>(null)

  // Approve confirmation
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [pendingApproveId, setPendingApproveId] = useState<number | null>(null)

  // Reject confirmation
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [pendingRejectId, setPendingRejectId] = useState<number | null>(null)

  const editMutation = useEditManualAttendanceDailyApply()
  const approveRepAuthMutation = useApproveManualAttendanceByRepAuth()
  const approveHrMutation = useApproveManualAttendanceByHr()
  const rejectMutation = useRejectManualAttendance()

  // Employee ids that report to this user (for the reporting-authority view)
  const subordinateEmployeeIds = useMemo<Set<number>>(() => {
    if (isHr || !employees?.data || !empId?.data) return new Set()
    return new Set(
      (employees.data as any[])
        .filter((e) => e.reportingAuthorityId === empId.data)
        .map((e) => e.employeeId as number)
    )
  }, [employees, isHr, empId])

  // Applications visible to this user
  const visibleApplies = useMemo<GetAttendanceDailyApplyType[]>(() => {
    if (!appliesRes?.data) return []
    const all = appliesRes.data as GetAttendanceDailyApplyType[]

    if (isHr) {
      // HR sees applications already approved by the reporting authority
      // and not yet acted on by HR.
      return all.filter(
        (a) =>
          a.applyStatus === 'Pending' && a.approvedByRepAuth && !a.approvedByHr
      )
    }

    // Reporting authority sees pending applications from their subordinates
    // that they haven't acted on yet.
    return all.filter(
      (a) =>
        subordinateEmployeeIds.has(a.employeeId) &&
        a.applyStatus === 'Pending' &&
        !a.approvedByRepAuth
    )
  }, [appliesRes, isHr, subordinateEmployeeIds])

  const filtered = useMemo(() => {
    return visibleApplies.filter(
      (a) =>
        a.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.empCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        statusLabel(a.status).toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [visibleApplies, searchTerm])

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

  const handleSort = (col: keyof GetAttendanceDailyApplyType) => {
    if (col === sortColumn)
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

  // -------------------------------------------------------------------
  // Change popup
  // -------------------------------------------------------------------
  const openChangePopup = useCallback((record: GetAttendanceDailyApplyType) => {
    setChangingRecord(record)
    setChangeForm({
      firstIn: toTimeInputValue(record.firstIn),
      lastOut: toTimeInputValue(record.lastOut),
      status: record.status,
    })
    setChangeError(null)
    setIsChangeOpen(true)
  }, [])

  const closeChangePopup = useCallback(() => {
    setIsChangeOpen(false)
    setChangingRecord(null)
    setChangeForm(emptyChangeForm)
    setChangeError(null)
  }, [])

  const handleChangeSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setChangeError(null)

      if (!changingRecord) return
      if (!changeForm.status) {
        setChangeError('Please select a status.')
        return
      }

      const dateStr = String(changingRecord.attendanceDate).split('T')[0]

      editMutation.mutate(
        {
          id: changingRecord.id,
          data: {
            ...changingRecord,
            firstIn: combineDateTime(dateStr, changeForm.firstIn),
            lastOut: combineDateTime(dateStr, changeForm.lastOut),
            status: changeForm.status,
            updatedBy: userData?.userId ?? changingRecord.updatedBy,
          },
        },
        { onSuccess: closeChangePopup }
      )
    },
    [
      changeForm,
      changingRecord,
      editMutation,
      closeChangePopup,
      userData?.userId,
    ]
  )

  // -------------------------------------------------------------------
  // Approve / Reject
  // -------------------------------------------------------------------
  const handleApproveConfirm = () => {
    if (!pendingApproveId || !userData?.userId) return
    if (isHr) {
      approveHrMutation.mutate({
        id: pendingApproveId,
        updatedBy: userData.userId,
      })
    } else {
      approveRepAuthMutation.mutate({
        id: pendingApproveId,
        updatedBy: userData.userId,
      })
    }
    setApproveDialogOpen(false)
    setPendingApproveId(null)
  }

  const handleRejectConfirm = () => {
    if (!pendingRejectId || !userData?.userId) return
    rejectMutation.mutate({
      id: pendingRejectId,
      updatedBy: userData.userId,
    })
    setRejectDialogOpen(false)
    setPendingRejectId(null)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-md">
            <ShieldCheck className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {isHr
                ? 'Attendance Approvals — HR'
                : 'Attendance Approvals — Reporting Authority'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isHr
                ? 'Applications already approved by reporting authority'
                : 'Pending applications from your direct reports'}
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-56"
          />
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
                onClick={() => handleSort('employeeName')}
              >
                Employee <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('attendanceDate')}
              >
                Date <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>First In</TableHead>
              <TableHead>Last Out</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('status')}
              >
                Status <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!appliesRes ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No pending attendance applications
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((a, i) => (
                <TableRow key={a.id}>
                  <TableCell>
                    {(currentPage - 1) * itemsPerPage + i + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{a.employeeName}</span>
                      <span className="text-xs text-muted-foreground">
                        {a.empCode}
                      </span>
                    </div>
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => openChangePopup(a)}
                        title="Change data"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => {
                          setPendingApproveId(a.id)
                          setApproveDialogOpen(true)
                        }}
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setPendingRejectId(a.id)
                          setRejectDialogOpen(true)
                        }}
                        title="Reject"
                      >
                        <XCircle className="h-4 w-4" />
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

      {/* Change data popup */}
      <Popup
        isOpen={isChangeOpen}
        onClose={closeChangePopup}
        title="Change Attendance Data"
        size="sm:max-w-md"
      >
        <form onSubmit={handleChangeSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Input value={changingRecord?.employeeName ?? ''} disabled />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                value={
                  changingRecord
                    ? String(changingRecord.attendanceDate).split('T')[0]
                    : ''
                }
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label>
                Status <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={STATUS_OPTIONS}
                value={
                  changeForm.status
                    ? {
                        id: changeForm.status,
                        name: statusLabel(changeForm.status),
                      }
                    : null
                }
                onChange={(value) =>
                  setChangeForm((prev) => ({
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
                value={changeForm.firstIn}
                onChange={(e) =>
                  setChangeForm((prev) => ({
                    ...prev,
                    firstIn: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Last Out</Label>
              <Input
                type="time"
                value={changeForm.lastOut}
                onChange={(e) =>
                  setChangeForm((prev) => ({
                    ...prev,
                    lastOut: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {changeError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {changeError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeChangePopup}>
              Cancel
            </Button>
            <Button type="submit" disabled={editMutation.isPending}>
              {editMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Popup>

      {/* Approve confirmation */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Attendance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this attendance application?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveConfirm}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Approve
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject confirmation */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Attendance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this attendance application? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reject
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ManualAttendanceApprove
