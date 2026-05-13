'use client'

import type React from 'react'
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
import { ArrowUpDown, Search, Users, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import { Checkbox } from '@/components/ui/checkbox'
import type { AssignLeaveTypeType, GetEmployeeType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetAllEmployees,
  useGetLeaveTypes,
  useAssignLeaveType,
  useGetDepartments,
  useGetDesignations,
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

const Employees = () => {
  const { data: employees } = useGetAllEmployees()
  const { data: leaveTypes } = useGetLeaveTypes()
  const { data: departments } = useGetDepartments()
  const { data: designations } = useGetDesignations()
  console.log('🚀 ~ Employees ~ employees:', employees)
  console.log('🚀 ~ Employees ~ leaveTypes:', leaveTypes)

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [employeesPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetEmployeeType>('empFullName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isAssignPopupOpen, setIsAssignPopupOpen] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([])
  const [selectedYearPeriod, setSelectedYearPeriod] = useState<string>(
    new Date().getFullYear().toString()
  )
  const [selectedLeaveTypeIds, setSelectedLeaveTypeIds] = useState<number[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(
    null
  )

  // Generate year options (current year and next 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, i) => currentYear + i)
  }, [])

  // Helper functions to get department and designation names
  const getDepartmentName = useCallback(
    (departmentId: number) => {
      const dept = departments?.data?.find(
        (d: any) => d.departmentId === departmentId
      )
      return dept?.departmentName || '-'
    },
    [departments]
  )

  const getDesignationName = useCallback(
    (designationId: number) => {
      const desig = designations?.data?.find(
        (d: any) => d.designationId === designationId
      )
      return desig?.designationName || '-'
    },
    [designations]
  )

  const handleInputChange = (leaveTypeId: number, checked: boolean) => {
    setSelectedLeaveTypeIds((prev) =>
      checked ? [...prev, leaveTypeId] : prev.filter((id) => id !== leaveTypeId)
    )
  }

  const resetForm = useCallback(() => {
    setSelectedEmployees([])
    setSelectedYearPeriod(new Date().getFullYear().toString())
    setSelectedLeaveTypeIds([])
    setIsAssignPopupOpen(false)
    setError(null)
  }, [])

  // Reset selected leave types when year period changes
  useEffect(() => {
    setSelectedLeaveTypeIds([])
  }, [selectedYearPeriod])

  const closePopup = useCallback(() => {
    setIsAssignPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const assignMutation = useAssignLeaveType({
    onClose: closePopup,
    reset: resetForm,
  })

  const resetDelete = useCallback(() => {
    setIsDeleteDialogOpen(false)
    setDeletingEmployeeId(null)
  }, [])

  const deleteMutation = useDeleteEmployee({
    onClose: resetDelete,
    reset: resetDelete,
  })

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
    return employees.data.filter((emp) => {
      const departmentName = getDepartmentName(emp.departmentId)
      const designationName = getDesignationName(emp.designationId)

      return (
        emp.empFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.workEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.empCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        designationName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [employees?.data, searchTerm, getDepartmentName, getDesignationName])

  const sortedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''

      if (sortColumn === 'departmentId') {
        aValue = getDepartmentName(a.departmentId)
        bValue = getDepartmentName(b.departmentId)
      } else if (sortColumn === 'designationId') {
        aValue = getDesignationName(a.designationId)
        bValue = getDesignationName(b.designationId)
      } else {
        aValue =
          typeof a[sortColumn] === 'string' || typeof a[sortColumn] === 'number'
            ? a[sortColumn]
            : ''
        bValue =
          typeof b[sortColumn] === 'string' || typeof b[sortColumn] === 'number'
            ? b[sortColumn]
            : ''
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })
  }, [
    filteredEmployees,
    sortColumn,
    sortDirection,
    getDepartmentName,
    getDesignationName,
  ])

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * employeesPerPage
    return sortedEmployees.slice(startIndex, startIndex + employeesPerPage)
  }, [sortedEmployees, currentPage, employeesPerPage])

  const totalPages = Math.ceil(sortedEmployees.length / employeesPerPage)

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedEmployees
        .map((emp) => emp.employeeId)
        .filter((id): id is number => id !== undefined)
      setSelectedEmployees(allIds)
    } else {
      setSelectedEmployees([])
    }
  }

  // Handle individual employee checkbox
  const handleSelectEmployee = (employeeId: number, checked: boolean) => {
    setSelectedEmployees((prev) =>
      checked ? [...prev, employeeId] : prev.filter((id) => id !== employeeId)
    )
  }

  // Check if all current page employees are selected
  const isAllSelected = useMemo(() => {
    const currentPageIds = paginatedEmployees
      .map((emp) => emp.employeeId)
      .filter((id): id is number => id !== undefined)
    return (
      currentPageIds.length > 0 &&
      currentPageIds.every((id) => selectedEmployees.includes(id))
    )
  }, [paginatedEmployees, selectedEmployees])

  // Check if some (but not all) employees are selected
  const isIndeterminate = useMemo(() => {
    const currentPageIds = paginatedEmployees
      .map((emp) => emp.employeeId)
      .filter((id): id is number => id !== undefined)
    const selectedCount = currentPageIds.filter((id) =>
      selectedEmployees.includes(id)
    ).length
    return selectedCount > 0 && selectedCount < currentPageIds.length
  }, [paginatedEmployees, selectedEmployees])

  // Filter leave types by selected year period
  const filteredLeaveTypes = useMemo(() => {
    if (!leaveTypes?.data) return []
    return leaveTypes.data.filter(
      (lt: any) => lt.yearPeriod === parseInt(selectedYearPeriod)
    )
  }, [leaveTypes?.data, selectedYearPeriod])

  // Get selected employee details
  const selectedEmployeeDetails = useMemo(() => {
    if (!employees?.data) return []
    return employees.data.filter((emp) =>
      selectedEmployees.includes(emp.employeeId!)
    )
  }, [employees?.data, selectedEmployees])

  const handleAssignLeaveTypes = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (selectedEmployees.length === 0) {
        setError('Please select at least one employee')
        return
      }

      if (selectedLeaveTypeIds.length === 0) {
        setError('Please select at least one leave type')
        return
      }

      setError(null)

      try {
        // Create array of employee-leaveType assignments
        const assignData = selectedEmployees.map((employeeId) => ({
          employeeId,
          leaveTypeIds: selectedLeaveTypeIds,
        }))

        assignMutation.mutate({
          data: assignData as any,
        })
      } catch (err) {
        setError('Failed to assign leave types')
        console.error(err)
      }
    },
    [selectedEmployees, selectedLeaveTypeIds, assignMutation]
  )

  useEffect(() => {
    if (assignMutation.error) {
      setError('Error assigning leave types')
    }
  }, [assignMutation.error])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <Users className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Employees</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-amber-400 hover:bg-amber-500 text-black"
            onClick={() => setIsAssignPopupOpen(true)}
            disabled={selectedEmployees.length === 0}
          >
            Assign Leave Type ({selectedEmployees.length})
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all employees"
                  className={
                    isIndeterminate ? 'data-[state=checked]:bg-amber-600' : ''
                  }
                />
              </TableHead>
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
                workEmail <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('officialPhone')}
                className="cursor-pointer"
              >
                Official Phone <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('departmentId')}
                className="cursor-pointer"
              >
                Department <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('designationId')}
                className="cursor-pointer"
              >
                Designation <ArrowUpDown className="ml-2 h-4 w-4 inline" />
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
                <TableCell colSpan={9} className="text-center py-4">
                  Loading employees...
                </TableCell>
              </TableRow>
            ) : !employees.data || employees.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No employees found
                </TableCell>
              </TableRow>
            ) : paginatedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No employees match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((emp, index) => (
                <TableRow key={emp.employeeId || index}>
                  <TableCell>
                    <Checkbox
                      checked={selectedEmployees.includes(emp.employeeId!)}
                      onCheckedChange={(checked) =>
                        handleSelectEmployee(
                          emp.employeeId!,
                          checked as boolean
                        )
                      }
                      aria-label={`Select ${emp.empFullName}`}
                    />
                  </TableCell>
                  <TableCell>
                    {(currentPage - 1) * employeesPerPage + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{emp.empCode}</TableCell>
                  <TableCell>{emp.empFullName}</TableCell>
                  <TableCell>{emp.workEmail}</TableCell>
                  <TableCell>{emp.officialPhone}</TableCell>
                  <TableCell>{getDepartmentName(emp.departmentId)}</TableCell>
                  <TableCell>{getDesignationName(emp.designationId)}</TableCell>
                  <TableCell>{emp.basicSalary}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/dashboard/employee-management/edit-employee/${emp.employeeId}`}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:text-amber-700"
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
                    </div>
                  </TableCell>
                </TableRow>
              ))
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

      <Popup
        isOpen={isAssignPopupOpen}
        onClose={closePopup}
        title="Assign Leave Types"
        size="sm:max-w-2xl"
      >
        <form onSubmit={handleAssignLeaveTypes} className="space-y-4 py-4">
          <div className="grid gap-4">
            {/* Selected Employees Section */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Selected Employees ({selectedEmployeeDetails.length})
              </Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto bg-gray-50">
                <div className="space-y-2">
                  {selectedEmployeeDetails.map((emp) => (
                    <div
                      key={emp.employeeId}
                      className="flex items-center justify-between text-sm p-2 bg-white rounded border"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{emp.empFullName}</p>
                        <p className="text-gray-500 text-xs">
                          {emp.empCode} • {emp.workEmail}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>{getDepartmentName(emp.departmentId)}</p>
                        <p>{getDesignationName(emp.designationId)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearPeriod">
                Year Period <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedYearPeriod}
                onValueChange={setSelectedYearPeriod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Leave Types for {selectedYearPeriod}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <div className="border rounded-md p-4 space-y-3 max-h-60 overflow-y-auto">
                {!leaveTypes || leaveTypes.data === undefined ? (
                  <p className="text-sm text-gray-500">
                    Loading leave types...
                  </p>
                ) : filteredLeaveTypes.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No leave types available for {selectedYearPeriod}
                  </p>
                ) : (
                  filteredLeaveTypes.map((leaveType: any) => (
                    <div
                      key={leaveType.leaveTypeId}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`leave-${leaveType.leaveTypeId}`}
                        checked={selectedLeaveTypeIds.includes(
                          leaveType.leaveTypeId
                        )}
                        onCheckedChange={(checked) =>
                          handleInputChange(
                            leaveType.leaveTypeId,
                            checked as boolean
                          )
                        }
                      />
                      <label
                        htmlFor={`leave-${leaveType.leaveTypeId}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {leaveType.leaveTypeName} ({leaveType.totalLeaves || 0}{' '}
                        days)
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <p className="text-sm text-gray-700 font-medium">Summary</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  • Employees: {selectedEmployees.length}
                </p>
                <p className="text-sm text-gray-600">
                  • Leave Types: {selectedLeaveTypeIds.length}
                </p>
                <p className="text-sm text-gray-600">
                  • Year: {selectedYearPeriod}
                </p>
              </div>
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
            <Button
              type="submit"
              disabled={assignMutation.isPending}
              className="bg-amber-400 hover:bg-amber-500 text-black"
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </form>
      </Popup>

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
