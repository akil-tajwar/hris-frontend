'use client'

import type React from 'react'
import { useCallback, useState, useMemo } from 'react'
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
import { ArrowUpDown, Search, ClipboardList, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateEmployeeLeaveAssignmentType,
  GetEmployeeLeaveAssignmentType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetEmployeeLeaveAssignments,
  useCreateEmployeeLeaveAssignment,
  useUpdateEmployeeLeaveAssignment,
  useDeleteEmployeeLeaveAssignment,
  useGetAllEmployees,
  useGetLeavePolicies,
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
import { CustomCombobox } from '@/utils/custom-combobox'
import CustomSwitch from '@/utils/custom-switch'

const EmployeeLeaveAssignments = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: employeeLeaveAssignments } = useGetEmployeeLeaveAssignments()
  const { data: employees } = useGetAllEmployees()
  const { data: leavePolicies } = useGetLeavePolicies()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [assignmentsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetEmployeeLeaveAssignmentType>('employeeName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<
    number | null
  >(null)

  const [formData, setFormData] = useState<CreateEmployeeLeaveAssignmentType>({
    employeeId: 0,
    leavePolicyMasterId: 0,
    effectiveFrom: new Date(),
    effectiveTo: null,
    active: true,
    createdBy: userData?.userId || 0,
  })

  // Employee combobox items
  const employeeItems = useMemo(() => {
    if (!employees?.data) return []
    return employees.data.map((emp: any) => ({
      id: emp.employeeId.toString(),
      name: `${emp.empCode} - ${emp.empFullName} - ${emp.departmentName} - ${emp.designationName}`,
    }))
  }, [employees?.data])

  // Leave policy combobox items
  const leavePolicyItems = useMemo(() => {
    if (!leavePolicies?.data) return []
    const list = Array.isArray(leavePolicies.data)
      ? leavePolicies.data
      : [leavePolicies.data]
    return list.map((p: any) => ({
      id: p.leavePolicyMaster?.leavePolicyMasterId?.toString(),
      name: p.leavePolicyMaster?.policyName,
    }))
  }, [leavePolicies?.data])

  const toInputDate = (date: Date | string | null | undefined) => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const resetForm = useCallback(() => {
    setFormData({
      employeeId: 0,
      leavePolicyMasterId: 0,
      effectiveFrom: new Date(),
      effectiveTo: null,
      active: true,
      createdBy: userData?.userId || 0,
    })
    setEditingAssignmentId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useCreateEmployeeLeaveAssignment({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateEmployeeLeaveAssignment({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteEmployeeLeaveAssignment({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetEmployeeLeaveAssignmentType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredAssignments = useMemo(() => {
    if (!employeeLeaveAssignments?.data) return []
    return employeeLeaveAssignments.data.filter(
      (a: GetEmployeeLeaveAssignmentType) =>
        a.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.empCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.policyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.designationName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employeeLeaveAssignments?.data, searchTerm])

  const sortedAssignments = useMemo(() => {
    return [...filteredAssignments].sort((a, b) => {
      const aValue = (a[sortColumn] ?? '') as string
      const bValue = (b[sortColumn] ?? '') as string
      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })
  }, [filteredAssignments, sortColumn, sortDirection])

  const paginatedAssignments = useMemo(() => {
    const startIndex = (currentPage - 1) * assignmentsPerPage
    return sortedAssignments.slice(startIndex, startIndex + assignmentsPerPage)
  }, [sortedAssignments, currentPage, assignmentsPerPage])

  const totalPages = Math.ceil(sortedAssignments.length / assignmentsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!formData.employeeId) {
        setError('Please select an employee')
        return
      }
      if (!formData.leavePolicyMasterId) {
        setError('Please select a leave policy')
        return
      }
      if (!formData.effectiveFrom) {
        setError('Effective from date is required')
        return
      }

      try {
        if (isEditMode && editingAssignmentId) {
          const updateData: GetEmployeeLeaveAssignmentType = {
            ...formData,
            employeeLeaveAssignmentId: editingAssignmentId,
            updatedBy: userData?.userId || 0,
            updatedAt: new Date(),
            employeeName: '',
            empCode: '',
            designationName: '',
            departmentName: '',
            policyName: '',
          }
          updateMutation.mutate({ id: editingAssignmentId, data: updateData })
        } else {
          const createData: CreateEmployeeLeaveAssignmentType = {
            ...formData,
            createdBy: userData?.userId || 0,
          }
          addMutation.mutate(createData)
        }
      } catch (err) {
        setError('Failed to save employee leave assignment')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingAssignmentId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  const handleEditClick = (assignment: GetEmployeeLeaveAssignmentType) => {
    setFormData({
      employeeId: assignment.employeeId,
      leavePolicyMasterId: assignment.leavePolicyMasterId,
      effectiveFrom: assignment.effectiveFrom,
      effectiveTo: assignment.effectiveTo ?? null,
      active: assignment.active,
      createdBy: userData?.userId || 0,
    })
    setEditingAssignmentId(assignment.employeeLeaveAssignmentId || null)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <ClipboardList className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Employee Leave Assignments</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-blue-400 hover:bg-blue-500 text-black"
            onClick={() => setIsPopupOpen(true)}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead
                onClick={() => handleSort('employeeName')}
                className="cursor-pointer"
              >
                Employee Details <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('policyName')}
                className="cursor-pointer"
              >
                Leave Policy <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('effectiveFrom')}
                className="cursor-pointer"
              >
                Effective From <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('effectiveTo')}
                className="cursor-pointer"
              >
                Effective To <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!employeeLeaveAssignments ||
            employeeLeaveAssignments.data === undefined ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading employee leave assignments...
                </TableCell>
              </TableRow>
            ) : !employeeLeaveAssignments.data ||
              employeeLeaveAssignments.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No employee leave assignments found
                </TableCell>
              </TableRow>
            ) : paginatedAssignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No employee leave assignments match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedAssignments.map(
                (assignment: GetEmployeeLeaveAssignmentType, index) => (
                  <TableRow key={assignment.employeeLeaveAssignmentId ?? index}>
                    <TableCell>
                      {(currentPage - 1) * assignmentsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          {assignment.employeeName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {assignment.empCode}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {assignment.departmentName} ·{' '}
                          {assignment.designationName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{assignment.policyName}</TableCell>
                    <TableCell>
                      {formatDate(assignment.effectiveFrom)}
                    </TableCell>
                    <TableCell>{formatDate(assignment.effectiveTo)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          assignment.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {assignment.active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => handleEditClick(assignment)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setDeletingAssignmentId(
                              assignment.employeeLeaveAssignmentId || null
                            )
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </div>

      {sortedAssignments.length > 0 && (
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
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={
          isEditMode
            ? 'Edit Employee Leave Assignment'
            : 'Add Employee Leave Assignment'
        }
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            {/* Employee combobox */}
            <div className="space-y-2">
              <Label htmlFor="employee">
                Employee <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={employeeItems}
                value={
                  formData.employeeId
                    ? {
                        id: formData.employeeId.toString(),
                        name:
                          employeeItems.find(
                            (e) => e.id === formData.employeeId.toString()
                          )?.name || '',
                      }
                    : null
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    employeeId: value ? Number(value.id) : 0,
                  }))
                }
                placeholder="Select employee (Code - Name - Department - Designation)"
              />
            </div>

            {/* Leave Policy combobox */}
            <div className="space-y-2">
              <Label htmlFor="leavePolicyMasterId">
                Leave Policy <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={leavePolicyItems}
                value={
                  formData.leavePolicyMasterId
                    ? {
                        id: formData.leavePolicyMasterId.toString(),
                        name:
                          leavePolicyItems.find(
                            (p) =>
                              p.id === formData.leavePolicyMasterId.toString()
                          )?.name || '',
                      }
                    : null
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    leavePolicyMasterId: value ? Number(value.id) : 0,
                  }))
                }
                placeholder="Select leave policy"
              />
            </div>

            {/* Effective From */}
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">
                Effective From <span className="text-red-500">*</span>
              </Label>
              <Input
                id="effectiveFrom"
                name="effectiveFrom"
                type="date"
                value={toInputDate(formData.effectiveFrom)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    effectiveFrom: e.target.value
                      ? new Date(e.target.value)
                      : new Date(),
                  }))
                }
                required
              />
            </div>

            {/* Effective To */}
            <div className="space-y-2">
              <Label htmlFor="effectiveTo">Effective To</Label>
              <Input
                id="effectiveTo"
                name="effectiveTo"
                type="date"
                value={toInputDate(formData.effectiveTo)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    effectiveTo: e.target.value
                      ? new Date(e.target.value)
                      : null,
                  }))
                }
              />
            </div>

            {/* Active */}
            <div className="space-y-2">
              <CustomSwitch
                label="Active"
                checked={formData.active}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, active: value }))
                }
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
            <Button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {addMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : 'Save'}
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
            <AlertDialogTitle>
              Delete Employee Leave Assignment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee leave assignment?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingAssignmentId) {
                  deleteMutation.mutate({ id: deletingAssignmentId })
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

export default EmployeeLeaveAssignments
