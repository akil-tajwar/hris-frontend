'use client'

import React from 'react'
import { useCallback, useState, useMemo, useRef, useEffect } from 'react'
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
  ArrowUpDown,
  Search,
  Users,
  Edit2,
  Trash2,
  Briefcase,
  ChevronDown,
  ChevronRight,
  UserCheck,
  EllipsisVertical,
  ArrowUpWideNarrow,
} from 'lucide-react'
import type { GetEmployeeType, GetAssetTransactionType } from '@/utils/type'
import {
  useGetAllEmployees,
  useGetAllAssets,
  useGetLatestAssetTransactions,
  useDeleteEmployee,
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
import Link from 'next/link'
import AssignAssetPopup from './assign-asset-popup'
import ProbationPromotionPopup from './probation-promotion-popup'
import PromoteEmployeePopup from './promote-employee-popup'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'

// ── Three-dot action menu ─────────────────────────────────────────────────────

type ActionMenuProps = {
  isProbationEmployee: boolean
  onAssignAsset: () => void
  onProbationConfirm: () => void
  onPromote: () => void
}

const ActionMenu = ({
  isProbationEmployee,
  onAssignAsset,
  onProbationConfirm,
  onPromote,
}: ActionMenuProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
      >
        <EllipsisVertical className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-48 rounded-md border bg-white shadow-lg py-1">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors"
            onClick={onAssignAsset}
          >
            <Briefcase className="h-4 w-4" />
            Assign Asset
          </button>

          <button
            type="button"
            disabled={isProbationEmployee}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onPromote}
          >
            <ArrowUpWideNarrow className="h-4 w-4" />
            Promote Employee
          </button>

          <button
            type="button"
            disabled={!isProbationEmployee}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onProbationConfirm}
          >
            <UserCheck className="h-4 w-4" />
            Confirm Probation
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const Employees = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: employees } = useGetAllEmployees()
  const { data: allAssets } = useGetAllAssets()
  const { data: assetTransactions } = useGetLatestAssetTransactions()

  const [currentPage, setCurrentPage] = useState(1)
  const [employeesPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetEmployeeType>('empFullName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [expandedEmployees, setExpandedEmployees] = useState<Set<number>>(
    new Set()
  )

  const [assignPopupOpen, setAssignPopupOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<{
    employeeId: number
    employeeName: string
  } | null>(null)

  const [promotionPopupOpen, setPromotionPopupOpen] = useState(false)
  const [promotionTarget, setPromotionTarget] = useState<{
    employeeId: number
    employeeName: string
  } | null>(null)

  const [promotePopupOpen, setPromotePopupOpen] = useState(false)
  const [promoteTarget, setPromoteTarget] = useState<{
    employeeId: number
    employeeName: string
  } | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(
    null
  )

  const getEmployeeAssets = useCallback(
    (employeeId: number): GetAssetTransactionType[] => {
      if (!assetTransactions?.data) return []
      return assetTransactions.data.filter(
        (t: GetAssetTransactionType) => t.employeeId === employeeId
      )
    },
    [assetTransactions]
  )

  const getAssetDetails = useCallback(
    (assetId: number) => {
      const asset = allAssets?.data?.find((a: any) => a.assetId === assetId)
      return asset
        ? {
            code: asset.assetCode,
            name: asset.assetName,
            category: asset.categoryName,
          }
        : { code: '-', name: `Asset #${assetId}`, category: '-' }
    },
    [allAssets]
  )

  const toggleAccordion = useCallback((employeeId: number) => {
    setExpandedEmployees((prev) => {
      const next = new Set(prev)
      next.has(employeeId) ? next.delete(employeeId) : next.add(employeeId)
      return next
    })
  }, [])

  const handleSort = (column: keyof GetEmployeeType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredEmployees = useMemo(() => {
    if (!employees?.data) return []
    return employees.data.filter(
      (emp) =>
        emp.empFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.workEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.empCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employmentTypeName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employees?.data, searchTerm])

  const sortedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      let aValue: string | number =
        typeof a[sortColumn] === 'string' || typeof a[sortColumn] === 'number'
          ? a[sortColumn]
          : ''
      let bValue: string | number =
        typeof b[sortColumn] === 'string' || typeof b[sortColumn] === 'number'
          ? b[sortColumn]
          : ''

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })
  }, [filteredEmployees, sortColumn, sortDirection])

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * employeesPerPage
    return sortedEmployees.slice(startIndex, startIndex + employeesPerPage)
  }, [sortedEmployees, currentPage, employeesPerPage])

  const totalPages = Math.ceil(sortedEmployees.length / employeesPerPage)

  const resetDelete = useCallback(() => {
    setIsDeleteDialogOpen(false)
    setDeletingEmployeeId(null)
  }, [])

  const deleteMutation = useDeleteEmployee({
    onClose: resetDelete,
    reset: resetDelete,
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <Users className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Employees</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Sl No.</TableHead>
              <TableHead
                onClick={() => handleSort('empCode')}
                className="cursor-pointer"
              >
                Emp Code <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('empFullName')}
                className="cursor-pointer"
              >
                Full Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('workEmail')}
                className="cursor-pointer"
              >
                Work Email <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('officialPhone')}
                className="cursor-pointer"
              >
                Official Phone <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() =>
                  handleSort('departmentName' as keyof GetEmployeeType)
                }
                className="cursor-pointer"
              >
                Department <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() =>
                  handleSort('designationName' as keyof GetEmployeeType)
                }
                className="cursor-pointer"
              >
                Designation <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() =>
                  handleSort('employmentTypeName' as keyof GetEmployeeType)
                }
                className="cursor-pointer"
              >
                Employment Type <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('basicSalary')}
                className="cursor-pointer"
              >
                Basic Salary <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!employees || employees.data === undefined ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">
                  Loading employees...
                </TableCell>
              </TableRow>
            ) : !employees.data || employees.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">
                  No employees found
                </TableCell>
              </TableRow>
            ) : paginatedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">
                  No employees match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((emp, index) => {
                const empAssets = getEmployeeAssets(emp.employeeId!)
                const hasAssets = empAssets.length > 0
                const isExpanded =
                  hasAssets && expandedEmployees.has(emp.employeeId!)
                const isProbationEmployee =
                  (emp as any).employmentTypeName === 'Probation'

                return (
                  <React.Fragment key={emp.employeeId ?? index}>
                    <TableRow
                      onClick={() => {
                        if (hasAssets) toggleAccordion(emp.employeeId!)
                      }}
                      className={
                        hasAssets ? 'cursor-pointer hover:bg-blue-50/50' : ''
                      }
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {hasAssets && (
                          <button
                            type="button"
                            onClick={() => toggleAccordion(emp.employeeId!)}
                            className="text-gray-500 hover:text-blue-600 transition-colors"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        {(currentPage - 1) * employeesPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600 hover:text-blue-700">
                        <Link href={`/dashboard/employee-management/employees/${emp.employeeId}`}>
                          {emp.empCode}
                        </Link>
                      </TableCell>
                      <TableCell>{emp.empFullName}</TableCell>
                      <TableCell>{emp.workEmail}</TableCell>
                      <TableCell>{emp.officialPhone}</TableCell>
                      <TableCell>{(emp as any).departmentName}</TableCell>
                      <TableCell>{(emp as any).designationName}</TableCell>
                      <TableCell>{(emp as any).employmentTypeName}</TableCell>
                      <TableCell>{emp.basicSalary}</TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end items-center gap-1">
                          <Link
                            href={`/dashboard/employee-management/edit-employee/${emp.employeeId}`}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setDeletingEmployeeId(emp.employeeId!)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <ActionMenu
                            isProbationEmployee={isProbationEmployee}
                            onAssignAsset={() => {
                              setAssignTarget({
                                employeeId: emp.employeeId!,
                                employeeName: emp.empFullName ?? '',
                              })
                              setAssignPopupOpen(true)
                            }}
                            onPromote={() => {
                              setPromoteTarget({
                                employeeId: emp.employeeId!,
                                employeeName: emp.empFullName ?? '',
                              })
                              setPromotePopupOpen(true)
                            }}
                            onProbationConfirm={() => {
                              setPromotionTarget({
                                employeeId: emp.employeeId!,
                                employeeName: emp.empFullName ?? '',
                              })
                              setPromotionPopupOpen(true)
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`accordion-${emp.employeeId}`}>
                        <TableCell colSpan={11} className="p-0 bg-blue-50/40">
                          <div className="px-8 py-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Assigned Assets
                            </p>
                            <table className="w-full text-sm border rounded-md overflow-hidden">
                              <thead>
                                <tr className="bg-blue-100 text-left">
                                  <th className="px-3 py-2 font-semibold text-gray-700">
                                    Asset Code
                                  </th>
                                  <th className="px-3 py-2 font-semibold text-gray-700">
                                    Asset Name
                                  </th>
                                  <th className="px-3 py-2 font-semibold text-gray-700">
                                    Category
                                  </th>
                                  <th className="px-3 py-2 font-semibold text-gray-700">
                                    Transaction Type
                                  </th>
                                  <th className="px-3 py-2 font-semibold text-gray-700">
                                    Transaction Date
                                  </th>
                                  <th className="px-3 py-2 font-semibold text-gray-700">
                                    Remarks
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {empAssets.map((t, i) => {
                                  const asset = getAssetDetails(t.assetId)
                                  return (
                                    <tr
                                      key={t.assetTransactionId ?? i}
                                      className={
                                        i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                      }
                                    >
                                      <td className="px-3 py-2 text-gray-700">
                                        {asset.code}
                                      </td>
                                      <td className="px-3 py-2 text-gray-800 font-medium">
                                        {asset.name}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {asset.category}
                                      </td>
                                      <td className="px-3 py-2">
                                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                          {t.transactionType}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {new Date(
                                          t.transactionDate
                                        ).toLocaleDateString()}
                                      </td>
                                      <td className="px-3 py-2 text-gray-500">
                                        {t.remarks || '—'}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {sortedEmployees.length > 0 && (
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

      {assignTarget && (
        <AssignAssetPopup
          isOpen={assignPopupOpen}
          onClose={() => {
            setAssignPopupOpen(false)
            setAssignTarget(null)
          }}
          employeeId={assignTarget.employeeId}
          employeeName={assignTarget.employeeName}
          assets={allAssets?.data ?? undefined}
        />
      )}

      {promotionTarget && (
        <ProbationPromotionPopup
          isOpen={promotionPopupOpen}
          onClose={() => {
            setPromotionPopupOpen(false)
            setPromotionTarget(null)
          }}
          employeeId={promotionTarget.employeeId}
          employeeName={promotionTarget.employeeName}
        />
      )}

      {promoteTarget && (
        <PromoteEmployeePopup
          isOpen={promotePopupOpen}
          onClose={() => {
            setPromotePopupOpen(false)
            setPromoteTarget(null)
          }}
          employeeId={promoteTarget.employeeId}
          employeeName={promoteTarget.employeeName}
        />
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeletingEmployeeId(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingEmployeeId) {
                  deleteMutation.mutate({ id: deletingEmployeeId })
                }
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

export default Employees
