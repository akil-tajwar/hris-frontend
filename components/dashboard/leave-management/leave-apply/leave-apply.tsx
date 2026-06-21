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
  useGetLeaveApplyNoOfDays,
} from '@/hooks/use-api'
import { CustomCombobox } from '@/utils/custom-combobox'
import type {
  CreateEmployeeLeaveApply,
  GetEmployeeLeaveApply,
} from '@/utils/type'
import { Badge } from '@/components/ui/badge'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  const [leaveTypeId, setLeaveTypeId] = useState(0)

  // Fetch noOfDays from API whenever the required fields are filled
  const { data: noOfDaysFromApi } = useGetLeaveApplyNoOfDays({
    userId: userData?.userId ?? 0,
    leaveTypeId,
    fromDate: effectiveFrom,
    toDate: effectiveTo,
  })
  console.log("🚀 ~ LeaveApply ~ noOfDaysFromApi:", noOfDaysFromApi)

  // Keep formData.noOfDays in sync with the API result
  const noOfDays = noOfDaysFromApi?.data ?? 0

  const handleDateChange = (
    field: 'effectiveFrom' | 'effectiveTo',
    value: string
  ) => {
    if (field === 'effectiveFrom') {
      setEffectiveFrom(value)
      setFormData((prev) => ({
        ...prev,
        effectiveFrom: new Date(value),
      }))
    } else {
      setEffectiveTo(value)
      setFormData((prev) => ({
        ...prev,
        effectiveTo: new Date(value),
      }))
    }
  }

  const handleLeaveTypeChange = (
    value: { id: string; name: string } | null
  ) => {
    const id = value ? Number(value.id) : 0
    setLeaveTypeId(id)
    setFormData((prev) => ({ ...prev, leaveTypeId: id }))
  }

  const reset = useCallback(() => {
    setFormData(emptyForm())
    setEffectiveFrom('')
    setEffectiveTo('')
    setLeaveTypeId(0)
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
        noOfDays,
      } as CreateEmployeeLeaveApply)
    },
    [formData, effectiveFrom, effectiveTo, noOfDays, createMutation, userData]
  )

  // Table data — only this employee's applications
  const myApplications = useMemo<GetEmployeeLeaveApply[]>(() => {
    if (!leaveApplications?.data) return []
    return leaveApplications.data.filter(
      (a: GetEmployeeLeaveApply) => a.createdBy === userData?.userId
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
                value={noOfDays}
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
