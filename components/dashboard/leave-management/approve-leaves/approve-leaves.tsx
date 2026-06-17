'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  ArrowUpDown,
  CheckCircle,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetEmployeeLeaveApplications,
  useGetAllEmployees,
  useApproveEmployeeLeaveRepAuth,
  useApproveEmployeeLeaveHr,
  useUpdateEmployeeLeaveApplication,
} from '@/hooks/use-api'
import type { GetEmployeeLeaveApply } from '@/utils/type'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HR_ROLE_ID = 2

const statusBadge = (a: GetEmployeeLeaveApply) => {
  if (a.status === 'Rejected')
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>
    )
  if (a.approvedByRepAuth && a.approvedByHr)
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        Fully Approved
      </Badge>
    )
  if (a.approvedByRepAuth)
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
        Awaiting HR
      </Badge>
    )
  return (
    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
      Pending
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ApproveLeaves = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const isHr = userData?.roleId === HR_ROLE_ID

  const { data: leaveApplications } = useGetEmployeeLeaveApplications()
  const { data: employees } = useGetAllEmployees()

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] =
    useState<keyof GetEmployeeLeaveApply>('effectiveFrom')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const itemsPerPage = 10

  // Confirm approve dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [pendingApproveId, setPendingApproveId] = useState<number | null>(null)

  // Confirm reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [pendingRejectId, setPendingRejectId] = useState<number | null>(null)

  const approveMutationRepAuth = useApproveEmployeeLeaveRepAuth()
  const approveMutationHr = useApproveEmployeeLeaveHr()
  const updateMutation = useUpdateEmployeeLeaveApplication({
    onClose: () => {},
    reset: () => {},
  })

  // Employee id set that reports to this user (for reporting authority view)
  const subordinateEmployeeIds = useMemo<Set<number>>(() => {
    if (isHr || !employees?.data || !userData?.userId) return new Set()
    return new Set(
      (employees.data as any[])
        .filter((e) => e.reportingAuthorityId === userData.userId)
        .map((e) => e.employeeId as number)
    )
  }, [employees, userData?.userId, isHr])

  // Filter applications visible to this user
  const visibleApplications = useMemo<GetEmployeeLeaveApply[]>(() => {
    if (!leaveApplications?.data) return []
    const all = leaveApplications.data as GetEmployeeLeaveApply[]

    if (isHr) {
      // HR sees applications where rep auth approved but HR hasn't yet (and not rejected)
      return all.filter(
        (a) => a.approvedByRepAuth && !a.approvedByHr && a.status !== 'Rejected'
      )
    }

    // Reporting authority sees applications from their subordinates that are fully pending
    return all.filter(
      (a) =>
        subordinateEmployeeIds.has(a.employeeId) &&
        !a.approvedByRepAuth &&
        !a.approvedByHr &&
        a.status !== 'Rejected'
    )
  }, [leaveApplications, isHr, subordinateEmployeeIds])

  const filtered = useMemo(() => {
    return visibleApplications.filter(
      (a) =>
        a.empFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.empCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.leaveTypeName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [visibleApplications, searchTerm])

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

  const handleApproveConfirm = () => {
    if (!pendingApproveId || !userData?.userId) return
    if (isHr) {
      approveMutationHr.mutate({
        id: pendingApproveId,
        updatedBy: userData.userId,
      })
    } else {
      approveMutationRepAuth.mutate({
        id: pendingApproveId,
        updatedBy: userData.userId,
      })
    }
    setApproveDialogOpen(false)
    setPendingApproveId(null)
  }

  const handleRejectConfirm = () => {
    if (!pendingRejectId) return
    const target = leaveApplications?.data?.find(
      (a: GetEmployeeLeaveApply) => a.employeeLeaveApplyId === pendingRejectId
    )
    if (!target) return
    updateMutation.mutate({
      id: pendingRejectId,
      data: { ...target, status: 'Rejected', updatedBy: userData?.userId ?? 0 },
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
                ? 'Leave Approvals — HR'
                : 'Leave Approvals — Reporting Authority'}
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
                onClick={() => handleSort('empFullName')}
              >
                Employee <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!leaveApplications ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No pending leave applications
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((a, i) => (
                <TableRow key={a.employeeLeaveApplyId}>
                  <TableCell>
                    {(currentPage - 1) * itemsPerPage + i + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{a.empFullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {a.empCode}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{a.leaveTypeName}</TableCell>
                  <TableCell>{String(a.effectiveFrom).split('T')[0]}</TableCell>
                  <TableCell>
                    {a.effectiveTo ? String(a.effectiveTo).split('T')[0] : '—'}
                  </TableCell>
                  <TableCell>{a.noOfDays}</TableCell>
                  <TableCell>{statusBadge(a)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => {
                          setPendingApproveId(a.employeeLeaveApplyId)
                          setApproveDialogOpen(true)
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setPendingRejectId(a.employeeLeaveApplyId)
                          setRejectDialogOpen(true)
                        }}
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

      {/* Approve confirmation */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Leave</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this leave application?
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
            <AlertDialogTitle>Reject Leave</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this leave application? This
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

export default ApproveLeaves
