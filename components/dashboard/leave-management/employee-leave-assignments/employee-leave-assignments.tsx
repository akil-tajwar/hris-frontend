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
  ArrowUpDown,
  Search,
  ClipboardList,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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

// Row shape used only inside the bulk-add table (not persisted as-is)
type BulkAssignmentRow = {
  employeeId: number
  empCode: string
  employeeName: string
  departmentName: string
  designationName: string
  leavePolicyMasterId: number
  policyName: string
  effectiveFrom: Date
  effectiveTo: Date | null
  alreadyAssigned: boolean
}

const EmployeeLeaveAssignments = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: employeeLeaveAssignments } = useGetEmployeeLeaveAssignments()
  const { data: employees } = useGetAllEmployees()
  const { data: leavePolicies } = useGetLeavePolicies()

  const [error, setError] = useState<string | null>(null)
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

  // Only one year group open at a time, collapsed by default
  const [expandedYear, setExpandedYear] = useState<number | null>(null)

  // Single-record form state — used only for edit mode
  const [formData, setFormData] = useState<CreateEmployeeLeaveAssignmentType>({
    employeeId: 0,
    leavePolicyMasterId: 0,
    effectiveFrom: new Date(),
    effectiveTo: null,
    active: true,
    createdBy: userData?.userId || 0,
  })

  // Table rows used only for bulk-add mode
  const [bulkRows, setBulkRows] = useState<BulkAssignmentRow[]>([])

  // Employee combobox items (used in edit mode, disabled)
  const employeeItems = useMemo(() => {
    if (!employees?.data) return []
    return employees.data.map((emp: any) => ({
      id: emp.employeeId.toString(),
      name: `${emp.empCode} - ${emp.empFullName} - ${emp.departmentName} - ${emp.designationName}`,
    }))
  }, [employees?.data])

  // Leave policy combobox items (used in edit mode, disabled)
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

  // Formats using LOCAL date parts (not toISOString/UTC) — using UTC here would
  // shift the displayed date back a day in timezones ahead of UTC (e.g. 12/31/25
  // instead of 1/1/26 for a local-midnight Jan 1 date).
  const toInputDate = (date: Date | string | null | undefined) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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
    setBulkRows([])
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

  // Group (already filtered + sorted) assignments by the year of effectiveFrom, newest year first
  const groupedByYear = useMemo(() => {
    const map = new Map<number, GetEmployeeLeaveAssignmentType[]>()
    sortedAssignments.forEach((a) => {
      const year = new Date(a.effectiveFrom).getFullYear()
      if (!map.has(year)) map.set(year, [])
      map.get(year)!.push(a)
    })
    return Array.from(map.entries()).sort(([yearA], [yearB]) => yearB - yearA)
  }, [sortedAssignments])

  // Build the bulk-add table rows for a given target year.
  // If copyFromYear is provided, prefill effective dates from that year's assignment (shifted forward),
  // falling back to Jan 1 - Dec 31 of the target year for employees with no assignment in copyFromYear.
  const buildBulkRows = useCallback(
    (targetYear: number, copyFromYear?: number): BulkAssignmentRow[] => {
      if (!employees?.data) return []

      return employees.data.map((emp: any) => {
        const leavePolicyMasterId = emp.leavePolicyMasterId ?? 0
        const policyName =
          leavePolicyItems.find((p) => p.id === leavePolicyMasterId?.toString())
            ?.name || 'N/A'

        const alreadyAssigned =
          employeeLeaveAssignments?.data?.some(
            (a: GetEmployeeLeaveAssignmentType) =>
              a.employeeId === emp.employeeId &&
              new Date(a.effectiveFrom).getFullYear() === targetYear
          ) ?? false

        let effectiveFrom = new Date(targetYear, 0, 1)

        if (copyFromYear) {
          const prevAssignment = employeeLeaveAssignments?.data?.find(
            (a: GetEmployeeLeaveAssignmentType) =>
              a.employeeId === emp.employeeId &&
              new Date(a.effectiveFrom).getFullYear() === copyFromYear
          )
          if (prevAssignment) {
            const fromDate = new Date(prevAssignment.effectiveFrom)
            effectiveFrom = new Date(
              targetYear,
              fromDate.getMonth(),
              fromDate.getDate()
            )
          }
        }

        // Effective To always auto-selects to Dec 31 of whatever year
        // effectiveFrom falls in — not copied from the source year's value.
        const effectiveTo: Date = new Date(effectiveFrom.getFullYear(), 11, 31)

        return {
          employeeId: emp.employeeId,
          empCode: emp.empCode,
          employeeName: emp.empFullName,
          departmentName: emp.departmentName,
          designationName: emp.designationName,
          leavePolicyMasterId,
          policyName,
          effectiveFrom,
          effectiveTo,
          alreadyAssigned,
        }
      })
    },
    [employees?.data, leavePolicyItems, employeeLeaveAssignments?.data]
  )

  // Opens the Add popup. Pass a year to trigger "copy to next year" behavior.
  const openAddPopup = useCallback(
    (copyFromYear?: number) => {
      const targetYear = copyFromYear
        ? copyFromYear + 1
        : new Date().getFullYear()
      setBulkRows(buildBulkRows(targetYear, copyFromYear))
      setIsEditMode(false)
      setEditingAssignmentId(null)
      setError(null)
      setIsPopupOpen(true)
    },
    [buildBulkRows]
  )

  const updateBulkRow = (
    employeeId: number,
    field: 'effectiveFrom' | 'effectiveTo',
    value: Date | null
  ) => {
    setBulkRows((prev) =>
      prev.map((row) =>
        row.employeeId === employeeId ? { ...row, [field]: value } : row
      )
    )
  }

  const handleBulkSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      const rowsToInsert = bulkRows.filter((row) => !row.alreadyAssigned)

      if (rowsToInsert.length === 0) {
        setError('All employees already have an assignment for this year')
        return
      }

      try {
        const payload: CreateEmployeeLeaveAssignmentType[] = rowsToInsert.map(
          (row) => ({
            employeeId: row.employeeId,
            leavePolicyMasterId: row.leavePolicyMasterId,
            effectiveFrom: row.effectiveFrom,
            effectiveTo: row.effectiveTo,
            active: true,
            createdBy: userData?.userId || 0,
          })
        )
        // NOTE: assumes the create hook/API now accepts an array for bulk insert.
        addMutation.mutate(payload)
      } catch (err) {
        setError('Failed to save employee leave assignments')
        console.error(err)
      }
    },
    [bulkRows, addMutation, userData]
  )

  const handleEditSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!formData.effectiveFrom) {
        setError('Effective from date is required')
        return
      }

      try {
        if (editingAssignmentId) {
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
        }
      } catch (err) {
        setError('Failed to save employee leave assignment')
        console.error(err)
      }
    },
    [formData, editingAssignmentId, updateMutation, userData]
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
    setError(null)
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
            onClick={() => openAddPopup()}
          >
            Add
          </Button>
        </div>
      </div>

      {!employeeLeaveAssignments ||
      employeeLeaveAssignments.data === undefined ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading employee leave assignments...
        </div>
      ) : !employeeLeaveAssignments.data ||
        employeeLeaveAssignments.data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No employee leave assignments found
        </div>
      ) : groupedByYear.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No employee leave assignments match your search
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByYear.map(([year, assignments]) => {
            const isGroupExpanded = expandedYear === year
            return (
              <div
                key={year}
                className="rounded-lg border border-gray-200 overflow-hidden shadow-sm"
              >
                {/* Group Header — click to expand/collapse */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedYear(isGroupExpanded ? null : year)}
                  className="w-full bg-blue-200 px-6 py-4 flex items-center gap-3 text-left cursor-pointer"
                >
                  <Calendar className="h-5 w-5 text-black" />
                  <h3 className="text-lg font-semibold text-black">{year}</h3>
                  <span className="ml-auto bg-black/10 px-3 py-1 rounded-full text-sm font-medium text-black">
                    {assignments.length}{' '}
                    {assignments.length === 1 ? 'employee' : 'employees'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-black hover:bg-black/10 shrink-0"
                    title={`Copy to ${year + 1}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      openAddPopup(year)
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-black transition-transform duration-200',
                      isGroupExpanded && 'rotate-180'
                    )}
                  />
                </div>

                {/* Assignment Table */}
                {isGroupExpanded && (
                  <div className="bg-white">
                    <Table>
                      <TableHeader className="bg-blue-100">
                        <TableRow>
                          <TableHead>Sl No.</TableHead>
                          <TableHead
                            onClick={() => handleSort('employeeName')}
                            className="cursor-pointer"
                          >
                            Employee Details{' '}
                            <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort('policyName')}
                            className="cursor-pointer"
                          >
                            Leave Policy{' '}
                            <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort('effectiveFrom')}
                            className="cursor-pointer"
                          >
                            Effective From{' '}
                            <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort('effectiveTo')}
                            className="cursor-pointer"
                          >
                            Effective To{' '}
                            <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map(
                          (
                            assignment: GetEmployeeLeaveAssignmentType,
                            index: number
                          ) => (
                            <TableRow
                              key={
                                assignment.employeeLeaveAssignmentId ?? index
                              }
                            >
                              <TableCell>{index + 1}</TableCell>
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
                              <TableCell>
                                {formatDate(assignment.effectiveTo)}
                              </TableCell>
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
                                        assignment.employeeLeaveAssignmentId ||
                                          null
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
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={
          isEditMode
            ? 'Edit Employee Leave Assignment'
            : 'Add Employee Leave Assignments'
        }
        size={isEditMode ? 'sm:max-w-md' : 'sm:max-w-3xl'}
      >
        {isEditMode ? (
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="grid gap-4">
              {/* Employee combobox - disabled in edit mode */}
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <div className="pointer-events-none opacity-60">
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
                    onChange={() => {}}
                    disabled
                    placeholder="Select employee (Code - Name - Department - Designation)"
                  />
                </div>
              </div>

              {/* Leave Policy combobox - disabled in edit mode */}
              <div className="space-y-2">
                <Label htmlFor="leavePolicyMasterId">Leave Policy</Label>
                <div className="pointer-events-none opacity-60">
                  <CustomCombobox
                    items={leavePolicyItems}
                    value={
                      formData.leavePolicyMasterId
                        ? {
                            id: formData.leavePolicyMasterId.toString(),
                            name:
                              leavePolicyItems.find(
                                (p) =>
                                  p.id ===
                                  formData.leavePolicyMasterId.toString()
                              )?.name || '',
                          }
                        : null
                    }
                    onChange={() => {}}
                    disabled
                    placeholder="Select leave policy"
                  />
                </div>
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
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="space-y-4 py-4">
            <div className="max-h-[60vh] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader className="bg-blue-100 sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Policy</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Effective To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkRows.map((row) => (
                    <TableRow
                      key={row.employeeId}
                      className={row.alreadyAssigned ? 'bg-slate-100' : ''}
                    >
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm">
                            {row.employeeName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {row.empCode} · {row.departmentName} ·{' '}
                            {row.designationName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.policyName}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          className="w-40"
                          disabled={row.alreadyAssigned}
                          value={toInputDate(row.effectiveFrom)}
                          onChange={(e) =>
                            updateBulkRow(
                              row.employeeId,
                              'effectiveFrom',
                              e.target.value
                                ? new Date(e.target.value)
                                : row.effectiveFrom
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          className="w-40"
                          disabled={row.alreadyAssigned}
                          value={toInputDate(row.effectiveTo)}
                          onChange={(e) =>
                            updateBulkRow(
                              row.employeeId,
                              'effectiveTo',
                              e.target.value ? new Date(e.target.value) : null
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        )}
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
