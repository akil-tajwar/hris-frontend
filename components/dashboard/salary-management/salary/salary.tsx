'use client'

import React from 'react'
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
  DollarSign,
  Trash2,
  Calendar,
  ChevronDown,
  XCircle,
  CheckCircle,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateSalaryType,
  GetSalaryType,
  GetEmployeeSalaryComponentType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddSalary,
  useDeleteSalary,
  useGetSalaries,
  useGetAllEmployees,
  useGetEmployeeSalaryComponents,
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
import { cn } from '@/lib/utils'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

interface SalaryFormData {
  salaryMonth: string
  salaryYear: number
}

const defaultForm = (): SalaryFormData => ({
  salaryMonth: MONTHS[new Date().getMonth()],
  salaryYear: new Date().getFullYear(),
})

const Salaries = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: salaries } = useGetSalaries()
  const { data: employeeSalaryComponents } =
    useGetEmployeeSalaryComponents()
  console.log(
    '🚀 ~ Salaries ~ employeeSalaryComponents:',
    employeeSalaryComponents
  )
  const { data: employees } = useGetAllEmployees()
  console.log('🚀 ~ Salaries ~ employees:', employees)

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [groupsPerPage] = useState(5)
  const [sortColumn, setSortColumn] = useState<string>('employeeName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingSalaryId, setDeletingSalaryId] = useState<number | null>(null)

  // Accordion state for main table
  const [expandedSalaryId, setExpandedSalaryId] = useState<number | null>(null)

  // Accordion state for create popup (keyed by employeeId)
  const [expandedPopupEmpId, setExpandedPopupEmpId] = useState<number | null>(
    null
  )

  const [form, setForm] = useState<SalaryFormData>(defaultForm())

  const resetForm = useCallback(() => {
    setForm(defaultForm())
    setIsPopupOpen(false)
    setError(null)
    setExpandedPopupEmpId(null)
  }, [])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddSalary({ onClose: closePopup, reset: resetForm })
  const deleteMutation = useDeleteSalary({
    onClose: closePopup,
    reset: resetForm,
  })

  // Helper: get other components for a given employee + month + year
  const getEmpComponents = useCallback(
    (
      employeeId: number,
      salaryMonth: string,
      salaryYear: number
    ): GetEmployeeSalaryComponentType[] => {
      return (employeeSalaryComponents?.data ?? []).filter(
        (c: GetEmployeeSalaryComponentType) =>
          c.employeeId === employeeId &&
          c.salaryMonth === salaryMonth &&
          c.salaryYear === salaryYear
      )
    },
    [employeeSalaryComponents?.data]
  )

  /**
   * Authorization logic:
   * - Allowance: always counted regardless of isAuthorized
   * - Deduction: counted if isAuthorized !== 1 OR if salaryComponentId === 6 (always counted)
   *   If isAuthorized === 1 AND salaryComponentId !== 6, skip the deduction.
   */
  const calcSalaries = useCallback(
    (
      employeeId: number,
      salaryMonth: string,
      salaryYear: number,
      basicSalary: number
    ) => {
      const comps = getEmpComponents(employeeId, salaryMonth, salaryYear)

      const allowances = comps
        .filter((c) => c.componentType === 'Allowance')
        .reduce((sum, c) => sum + c.amount, 0)

      const deductions = comps
        .filter(
          (c) =>
            c.componentType === 'Deduction' &&
            (c.isAuthorized !== 1 || c.isLoneFee === 1) &&
            c.isSkipped !== 1
        )
        .reduce((sum, c) => sum + c.amount, 0)

      return {
        grossSalary: basicSalary + allowances,
        netSalary: basicSalary + allowances - deductions,
        allowances,
        deductions,
      }
    },
    [getEmpComponents]
  )

  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredSalaries = useMemo(() => {
    if (!salaries?.data || !Array.isArray(salaries.data)) return []
    return salaries.data.filter((s: GetSalaryType) =>
      s.salary.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [salaries?.data, searchTerm])

  // Group by salaryMonth + salaryYear
  const groupedSalaries = useMemo(() => {
    const groups = filteredSalaries.reduce(
      (acc: Record<string, GetSalaryType[]>, salary: GetSalaryType) => {
        const key = `${salary.salary.salaryYear}-${salary.salary.salaryMonth}`
        if (!acc[key]) acc[key] = []
        acc[key].push(salary)
        return acc
      },
      {}
    )

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a: GetSalaryType, b: GetSalaryType) => {
        const aVal = (a.salary as any)[sortColumn] ?? ''
        const bVal = (b.salary as any)[sortColumn] ?? ''
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }
        return sortDirection === 'asc'
          ? aVal > bVal
            ? 1
            : -1
          : bVal > aVal
            ? 1
            : -1
      })
    })

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredSalaries, sortColumn, sortDirection])

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * groupsPerPage
    return groupedSalaries.slice(startIndex, startIndex + groupsPerPage)
  }, [groupedSalaries, currentPage, groupsPerPage])

  const totalPages = Math.ceil(groupedSalaries.length / groupsPerPage)

  // Bulk create: build array of CreateSalaryType and send in one call
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      try {
        if (!employees?.data) {
          setError('Employee data not loaded')
          return
        }
        const activeEmployees = employees.data.filter(
          (e: any) => e.isActive === 1
        )

        const payload: CreateSalaryType[] = activeEmployees.map((emp: any) => {
          const basicSalary: number = emp.basicSalary ?? 0
          const { grossSalary, netSalary } = calcSalaries(
            emp.employeeId,
            form.salaryMonth,
            form.salaryYear,
            basicSalary
          )
          return {
            salaryMonth: form.salaryMonth,
            salaryYear: form.salaryYear,
            employeeId: emp.employeeId,
            departmentId: emp.departmentId ?? 0,
            designationId: emp.designationId ?? 0,
            basicSalary,
            grossSalary,
            netSalary,
            doj: emp.doj ?? '',
            createdBy: userData?.userId || 0,
          }
        })

        await addMutation.mutateAsync(payload as any)
      } catch (err) {
        setError('Failed to save salary')
        console.error(err)
      }
    },
    [form, addMutation, userData, employees?.data, calcSalaries]
  )

  const formatGroupLabel = (key: string) => {
    const [year, month] = key.split('-')
    return `${month} ${year}`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <DollarSign className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Salaries</h2>
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
            onClick={() => setIsPopupOpen(true)}
          >
            Add Salary
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {!salaries || salaries.data === undefined ? (
          <div className="text-center py-8 text-gray-500">
            Loading salaries...
          </div>
        ) : !salaries.data || salaries.data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No salaries found
          </div>
        ) : paginatedGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No salaries match your search
          </div>
        ) : (
          paginatedGroups.map(([key, groupSalaries]) => (
            <div
              key={key}
              className="rounded-lg border border-gray-200 overflow-hidden shadow-sm"
            >
              {/* Group Header */}
              <div className="bg-amber-200 px-6 py-4 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-black" />
                <h3 className="text-lg font-semibold text-black">
                  {formatGroupLabel(key)}
                </h3>
                <span className="ml-auto bg-black/10 px-3 py-1 rounded-full text-sm font-medium text-black">
                  {groupSalaries.length}{' '}
                  {groupSalaries.length === 1 ? 'employee' : 'employees'}
                </span>
              </div>

              {/* Salary Table */}
              <div className="bg-white">
                <Table>
                  <TableHeader className="bg-amber-50">
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead className="w-20">Sl No.</TableHead>
                      <TableHead
                        onClick={() => handleSort('employeeName')}
                        className="cursor-pointer"
                      >
                        Employee Name
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort('basicSalary')}
                        className="cursor-pointer"
                      >
                        Basic Salary
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead>Gross Salary</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupSalaries.map(
                      (salary: GetSalaryType, index: number) => {
                        const salaryId =
                          (salary.salary as any).salaryId ?? index
                        const isExpanded = expandedSalaryId === salaryId

                        const empComponents = getEmpComponents(
                          salary.salary.employeeId,
                          salary.salary.salaryMonth,
                          salary.salary.salaryYear
                        )

                        const allowanceTotal = empComponents
                          .filter((c) => c.componentType === 'Allowance')
                          .reduce((sum, c) => sum + c.amount, 0)

                        const deductionTotal = empComponents
                          .filter(
                            (c) =>
                              c.componentType === 'Deduction' &&
                              (c.isAuthorized !== 1 || c.isLoneFee === 1) &&
                              c.isSkipped !== 1
                          )
                          .reduce((sum, c) => sum + c.amount, 0)

                        return (
                          <React.Fragment key={salaryId}>
                            <TableRow className="hover:bg-amber-50/50">
                              <TableCell className="w-10 pr-0">
                                {empComponents.length > 0 && (
                                  <button
                                    onClick={() =>
                                      setExpandedSalaryId(
                                        isExpanded ? null : salaryId
                                      )
                                    }
                                    className="p-1 rounded hover:bg-amber-100 transition-colors"
                                    title="View other salary components"
                                  >
                                    <ChevronDown
                                      className={cn(
                                        'h-4 w-4 text-amber-600 transition-transform duration-200',
                                        isExpanded && 'rotate-180'
                                      )}
                                    />
                                  </button>
                                )}
                              </TableCell>
                              <TableCell className="font-medium text-gray-600">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-medium">
                                {salary.salary.employeeName}
                              </TableCell>
                              <TableCell>
                                {salary.salary.basicSalary.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {salary.salary.grossSalary.toLocaleString()}
                              </TableCell>
                              <TableCell className="font-semibold text-green-700">
                                {salary.salary.netSalary.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setDeletingSalaryId(salaryId)
                                      setIsDeleteDialogOpen(true)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Accordion row for main table */}
                            {isExpanded && (
                              <TableRow className="bg-amber-50/40">
                                <TableCell colSpan={7} className="py-0 px-0">
                                  <div className="pl-14 pr-6 py-4 border-t border-amber-100">
                                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">
                                      Other salary components —{' '}
                                      {salary.salary.salaryMonth}{' '}
                                      {salary.salary.salaryYear}
                                    </p>
                                    <Table className="border">
                                      <TableHeader>
                                        <TableRow className="bg-white">
                                          <TableHead className="text-xs w-20">
                                            Sl No.
                                          </TableHead>
                                          <TableHead className="text-xs">
                                            Component
                                          </TableHead>
                                          <TableHead className="text-xs">
                                            Type
                                          </TableHead>
                                          <TableHead className="text-xs">
                                            status
                                          </TableHead>
                                          <TableHead className="text-xs text-right">
                                            Amount
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {empComponents.map((c, idx) => {
                                          const isSkipped =
                                            c.componentType === 'Deduction' &&
                                            c.isAuthorized === 1 &&
                                            c.isLoneFee !== 1 &&
                                            c.isSkipped === 1
                                          return (
                                            <TableRow
                                              key={idx}
                                              className={cn(
                                                'bg-white',
                                                isSkipped && 'opacity-50'
                                              )}
                                            >
                                              <TableCell className="text-gray-500 text-sm">
                                                {idx + 1}
                                              </TableCell>
                                              <TableCell className="font-medium text-sm">
                                                {c.componentName}
                                              </TableCell>
                                              <TableCell>
                                                <span
                                                  className={cn(
                                                    'px-2 py-0.5 rounded-full text-xs font-semibold',
                                                    c.componentType ===
                                                      'Allowance'
                                                      ? 'bg-green-100 text-green-700'
                                                      : 'bg-red-100 text-red-700'
                                                  )}
                                                >
                                                  {c.componentType}
                                                </span>
                                              </TableCell>
                                              <TableCell>
                                                {(() => {
                                                  const isSkippedFinal =
                                                    c.isAuthorized === 1 &&
                                                    c.isSkipped === 1
                                                  const isAuthorizedFinal =
                                                    c.isAuthorized === 1 &&
                                                    c.isSkipped === 0

                                                  if (isSkippedFinal) {
                                                    return (
                                                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                        <XCircle className="h-3 w-3" />{' '}
                                                        Skipped
                                                      </span>
                                                    )
                                                  }

                                                  if (isAuthorizedFinal) {
                                                    return (
                                                      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                                        <CheckCircle className="h-3 w-3" />{' '}
                                                        Authorized
                                                      </span>
                                                    )
                                                  }

                                                  return (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                      <XCircle className="h-3 w-3" />{' '}
                                                      Unauthorized
                                                    </span>
                                                  )
                                                })()}
                                              </TableCell>
                                              <TableCell className="text-right font-medium text-sm">
                                                <span
                                                  className={cn(
                                                    c.componentType ===
                                                      'Allowance'
                                                      ? 'text-green-600'
                                                      : 'text-red-600',
                                                    isSkipped && 'line-through'
                                                  )}
                                                >
                                                  {c.componentType ===
                                                  'Allowance'
                                                    ? '+'
                                                    : '-'}
                                                  {c.amount.toLocaleString()}
                                                </span>
                                              </TableCell>
                                            </TableRow>
                                          )
                                        })}
                                      </TableBody>
                                    </Table>
                                    <div className="flex gap-6 mt-3 pt-2 border-t border-amber-100 text-sm">
                                      <span className="text-green-700 font-medium">
                                        Total Allowances: +
                                        {allowanceTotal.toLocaleString()}
                                      </span>
                                      <span className="text-red-600 font-medium">
                                        Total Deductions: -
                                        {deductionTotal.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        )
                      }
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {groupedSalaries.length > 0 && totalPages > 1 && (
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
                    <PaginationItem key={`index`}>
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

      {/* Create Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title="Add Salary"
        size="sm:max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Salary Month <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.salaryMonth}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, salaryMonth: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, index) => (
                    <SelectItem key={index} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Salary Year <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={form.salaryYear}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    salaryYear: Number(e.target.value),
                  }))
                }
                min={2000}
                max={2100}
                required
              />
            </div>
          </div>

          {/* Preview table of all active employees with accordion */}
          {employees?.data && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Employees (
                {employees.data.filter((e: any) => e.isActive === 1).length}{' '}
                active)
              </Label>

              <div className="border rounded-lg overflow-hidden">
                <Table className="border">
                  <TableHeader className="bg-amber-50">
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead className="w-20">Sl No.</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Basic Salary</TableHead>
                      <TableHead>Gross Salary</TableHead>
                      <TableHead>Net Salary</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {employees.data
                      .filter((e: any) => e.isActive === 1)
                      .map((emp: any, index: number) => {
                        const basicSalary: number = emp.basicSalary ?? 0

                        const { grossSalary, netSalary } = calcSalaries(
                          emp.employeeId,
                          form.salaryMonth,
                          form.salaryYear,
                          basicSalary
                        )

                        const empComponents = getEmpComponents(
                          emp.employeeId,
                          form.salaryMonth,
                          form.salaryYear
                        )

                        const allowanceTotal = empComponents
                          .filter((c) => c.componentType === 'Allowance')
                          .reduce((sum, c) => sum + c.amount, 0)

                        const deductionTotal = empComponents
                          .filter(
                            (c) =>
                              c.componentType === 'Deduction' &&
                              (c.isAuthorized !== 1 ||
                                c.salaryComponentId === 6)
                          )
                          .reduce((sum, c) => sum + c.amount, 0)

                        const isExpanded = expandedPopupEmpId === emp.employeeId

                        return (
                          <React.Fragment key={emp.employeeId}>
                            {/* Main Row */}
                            <TableRow className="hover:bg-amber-50/50">
                              <TableCell className="w-10 pr-0">
                                {empComponents.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedPopupEmpId(
                                        isExpanded ? null : emp.employeeId
                                      )
                                    }
                                    className="p-1 rounded hover:bg-amber-100 transition-colors"
                                    title="View other salary components"
                                  >
                                    <ChevronDown
                                      className={cn(
                                        'h-4 w-4 text-amber-600 transition-transform duration-200',
                                        isExpanded && 'rotate-180'
                                      )}
                                    />
                                  </button>
                                )}
                              </TableCell>

                              <TableCell className="text-gray-500">
                                {index + 1}
                              </TableCell>

                              <TableCell className="font-medium">
                                {emp.empFullName}
                              </TableCell>

                              <TableCell>
                                {basicSalary.toLocaleString()}
                              </TableCell>

                              <TableCell>
                                {grossSalary.toLocaleString()}
                              </TableCell>

                              <TableCell className="font-semibold text-green-700">
                                {netSalary.toLocaleString()}
                              </TableCell>
                            </TableRow>

                            {/* Expanded Row */}
                            {isExpanded && (
                              <TableRow className="bg-amber-50/40">
                                <TableCell colSpan={6} className="py-0 px-0">
                                  <div className="pl-12 pr-4 py-3 border-t border-amber-100">
                                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                                      Other salary components
                                    </p>

                                    <Table className="border">
                                      <TableHeader>
                                        <TableRow className="bg-white">
                                          <TableHead className="text-xs w-20">
                                            Sl No.
                                          </TableHead>
                                          <TableHead className="text-xs">
                                            Component
                                          </TableHead>
                                          <TableHead className="text-xs">
                                            Type
                                          </TableHead>
                                          <TableHead className="text-xs">
                                            Status
                                          </TableHead>
                                          <TableHead className="text-xs text-right">
                                            Amount
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>

                                      <TableBody>
                                        {empComponents.map(
                                          (c: any, idx: number) => {
                                            const isSkipped =
                                              c.componentType === 'Deduction' &&
                                              c.isAuthorized === 1 &&
                                              c.isLoneFee !== 1 &&
                                              c.isSkipped === 1

                                            const isSkippedFinal =
                                              c.isAuthorized === 1 &&
                                              c.isSkipped === 1

                                            const isAuthorizedFinal =
                                              c.isAuthorized === 1 &&
                                              c.isSkipped === 0

                                            return (
                                              <TableRow
                                                key={
                                                  c.id ??
                                                  `${emp.employeeId}-${idx}`
                                                }
                                                className={cn(
                                                  'bg-white',
                                                  isSkipped && 'opacity-50'
                                                )}
                                              >
                                                <TableCell className="text-gray-500 text-sm">
                                                  {idx + 1}
                                                </TableCell>

                                                <TableCell className="font-medium text-sm">
                                                  {c.componentName}
                                                </TableCell>

                                                <TableCell>
                                                  <span
                                                    className={cn(
                                                      'px-2 py-0.5 rounded-full text-xs font-semibold',
                                                      c.componentType ===
                                                        'Allowance'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                    )}
                                                  >
                                                    {c.componentType}
                                                  </span>
                                                </TableCell>

                                                <TableCell>
                                                  {isSkippedFinal ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                      <XCircle className="h-3 w-3" />{' '}
                                                      Skipped
                                                    </span>
                                                  ) : isAuthorizedFinal ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                                      <CheckCircle className="h-3 w-3" />{' '}
                                                      Authorized
                                                    </span>
                                                  ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                      <XCircle className="h-3 w-3" />{' '}
                                                      Unauthorized
                                                    </span>
                                                  )}
                                                </TableCell>

                                                <TableCell className="text-right font-medium text-sm">
                                                  <span
                                                    className={cn(
                                                      c.componentType ===
                                                        'Allowance'
                                                        ? 'text-green-600'
                                                        : 'text-red-600',
                                                      isSkipped &&
                                                        'line-through'
                                                    )}
                                                  >
                                                    {c.componentType ===
                                                    'Allowance'
                                                      ? '+'
                                                      : '-'}
                                                    {c.amount.toLocaleString()}
                                                  </span>
                                                </TableCell>
                                              </TableRow>
                                            )
                                          }
                                        )}
                                      </TableBody>
                                    </Table>

                                    <div className="flex gap-6 mt-2 pt-2 border-t border-amber-100 text-sm">
                                      <span className="text-green-700 font-medium">
                                        Total Allowances: +
                                        {allowanceTotal.toLocaleString()}
                                      </span>
                                      <span className="text-red-600 font-medium">
                                        Total Deductions: -
                                        {deductionTotal.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closePopup}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {addMutation.isPending ? 'Saving...' : 'Save Salary'}
            </Button>
          </div>
        </form>
      </Popup>

      {/* Delete Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Salary</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this salary record? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingSalaryId) {
                  deleteMutation.mutate({ id: deletingSalaryId })
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

export default Salaries
