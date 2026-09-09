'use client'

import type React from 'react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ArrowUpDown, Search, MapPin, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateEmployeeOfficeLocationType,
  GetEmployeeOfficeLocationType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddEmployeeOfficeLocation,
  useDeleteEmployeeOfficeLocation,
  useGetAllEmployees,
  useGetOfficeLocations,
  useGetEmployeeOfficeLocations,
  useUpdateEmployeeOfficeLocation,
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

const toDateInputValue = (value: unknown) => {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value as string)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

interface BulkEmployeeData {
  employeeId: number
  empFullName: string
  empCode: string
  departmentName: string
  designationName: string
  officeLocationId: number | null
  fromDate: Date | null
  toDate: Date | null
  existing?: boolean
  existingData?: {
    employeeOfficeLocationId: number
    officeLocationId: number
    fromDate: Date | null
    toDate: Date | null
  } | null
}

const EmployeeOfficeLocations = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: employeeOfficeLocations } = useGetEmployeeOfficeLocations()
  console.log(
    '🚀 ~ EmployeeOfficeLocations ~ employeeOfficeLocations:',
    employeeOfficeLocations
  )
  const { data: employees } = useGetAllEmployees()
  const { data: officeLocations } = useGetOfficeLocations()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [locationsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetEmployeeOfficeLocationType>('empFullName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingLocationId, setEditingLocationId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingLocationId, setDeletingLocationId] = useState<number | null>(
    null
  )

  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false)
  const [bulkEmployeeData, setBulkEmployeeData] = useState<BulkEmployeeData[]>(
    []
  )

  const defaultForm = useCallback<any>(
    () => ({
      officeLocationId: null,
      employeeId: null,
      fromDate: null,
      toDate: null,
      createdBy: userData?.userId || 0,
    }),
    [userData?.userId]
  )

  const [formData, setFormData] =
    useState<CreateEmployeeOfficeLocationType>(defaultForm)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? null : Number(value),
      }))
      return
    }
    if (type === 'date') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? null : new Date(value),
      }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = useCallback(() => {
    setFormData({ ...defaultForm, createdBy: userData?.userId || 0 })
    setEditingLocationId(null)
    setIsEditMode(false)
    setError(null)
    setBulkEmployeeData([])
    setShowOnlyUnassigned(false)
  }, [userData?.userId, defaultForm])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const openPopupForAdd = useCallback(() => {
    resetForm()
    setIsPopupOpen(true)
    setError(null)

    // Create a map of existing employee office locations
    const existingLocationsMap = new Map()
    employeeOfficeLocations?.data?.forEach((loc: any) => {
      existingLocationsMap.set(loc.employeeId, {
        employeeOfficeLocationId: loc.employeeOfficeLocationId,
        officeLocationId: loc.officeLocationId,
        fromDate: loc.fromDate,
        toDate: loc.toDate,
      })
    })

    const employeesList = (employees?.data || [])
      .filter((e: any) => e?.employeeId)
      .map((e: any) => {
        const existing = existingLocationsMap.get(e.employeeId)

        return {
          employeeId: e.employeeId,
          empFullName: e.empFullName || '',
          empCode: e.empCode || '',
          departmentName: e.departmentName || '',
          designationName: e.designationName || '',
          officeLocationId: existing?.officeLocationId || null,
          fromDate: existing?.fromDate || null,
          toDate: existing?.toDate || null,
          existing: !!existing,
          existingData: existing || null,
        }
      })

    setBulkEmployeeData(employeesList)
  }, [resetForm, employees?.data, employeeOfficeLocations?.data])

  const addMutation = useAddEmployeeOfficeLocation({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateEmployeeOfficeLocation({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteEmployeeOfficeLocation({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetEmployeeOfficeLocationType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleSelectChange = (
    field: 'officeLocationId' | 'employeeId',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : Number(value),
    }))
  }

  const handleBulkOfficeLocationChange = (
    employeeId: number,
    value: string
  ) => {
    setBulkEmployeeData((prev) =>
      prev.map((emp) =>
        emp.employeeId === employeeId
          ? { ...emp, officeLocationId: value === '' ? null : Number(value) }
          : emp
      )
    )
  }

  const handleBulkDateChange = (
    employeeId: number,
    field: 'fromDate' | 'toDate',
    value: string
  ) => {
    setBulkEmployeeData((prev) =>
      prev.map((emp) =>
        emp.employeeId === employeeId
          ? { ...emp, [field]: value ? new Date(value) : null }
          : emp
      )
    )
  }

  const getFilteredEmployees = useMemo(() => {
    if (showOnlyUnassigned) {
      return bulkEmployeeData.filter((emp) => !emp.existing)
    }
    return bulkEmployeeData
  }, [bulkEmployeeData, showOnlyUnassigned])

  const filteredLocations = useMemo(() => {
    if (!employeeOfficeLocations?.data) return []
    return employeeOfficeLocations.data.filter(
      (loc) =>
        loc.empFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.empCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.designationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.address?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employeeOfficeLocations?.data, searchTerm])

  const sortedLocations = useMemo(() => {
    return [...filteredLocations].sort((a, b) => {
      let aValue: any = a[sortColumn] ?? ''
      let bValue: any = b[sortColumn] ?? ''

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredLocations, sortColumn, sortDirection])

  const paginatedLocations = useMemo(() => {
    const startIndex = (currentPage - 1) * locationsPerPage
    return sortedLocations.slice(startIndex, startIndex + locationsPerPage)
  }, [sortedLocations, currentPage, locationsPerPage])

  const totalPages = Math.ceil(sortedLocations.length / locationsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      try {
        if (isEditMode) {
          // Single edit mode
          const submitData: CreateEmployeeOfficeLocationType = { ...formData }
          submitData.updatedBy = userData?.userId || 0

          if (editingLocationId) {
            updateMutation.mutate({
              id: editingLocationId,
              data: submitData as GetEmployeeOfficeLocationType,
            })
          }
        } else {
          // Bulk add/update mode - get employees that have data filled
          const employeesWithData = bulkEmployeeData.filter(
            (emp) => emp.officeLocationId && emp.fromDate
          )

          if (employeesWithData.length === 0) {
            setError(
              'Please fill Office Location and From Date for at least one employee'
            )
            return
          }

          // Separate into new and existing records
          const newRecords: CreateEmployeeOfficeLocationType[] = []
          const updateRecords: {
            id: number
            data: CreateEmployeeOfficeLocationType
          }[] = []

          employeesWithData.forEach((emp) => {
            const record: CreateEmployeeOfficeLocationType = {
              officeLocationId: emp.officeLocationId!,
              employeeId: emp.employeeId,
              fromDate: emp.fromDate!,
              toDate: emp.toDate || null,
              createdBy: userData?.userId || 0,
            }

            if (emp.existing && emp.existingData) {
              // Update existing record
              updateRecords.push({
                id: emp.existingData.employeeOfficeLocationId,
                data: { ...record, updatedBy: userData?.userId || 0 },
              })
            } else {
              // Create new record
              newRecords.push(record)
            }
          })

          // Execute mutations
          if (newRecords.length > 0) {
            addMutation.mutate(newRecords)
          }

          if (updateRecords.length > 0) {
            // Update each record individually
            updateRecords.forEach(({ id, data }) => {
              updateMutation.mutate({
                id,
                data: data as GetEmployeeOfficeLocationType,
              })
            })
          }

          if (newRecords.length === 0 && updateRecords.length === 0) {
            setError('No changes to save')
            return
          }

          // Close popup after successful mutations
          setTimeout(closePopup, 500)
        }
      } catch (err) {
        setError('Failed to save employee office location')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingLocationId,
      addMutation,
      updateMutation,
      userData,
      bulkEmployeeData,
      closePopup,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving employee office location')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (loc: any) => {
    setFormData({
      officeLocationId: loc.officeLocationId,
      employeeId: loc.employeeId,
      fromDate: loc.fromDate,
      toDate: loc.toDate,
      createdBy: userData?.userId || 0,
    })
    setEditingLocationId(loc.employeeOfficeLocationId)
    setIsEditMode(true)
    setIsPopupOpen(true)
    setError(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <MapPin className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Employee Office Locations</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search employee office locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-blue-400 hover:bg-blue-500 text-black"
            onClick={openPopupForAdd}
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
                onClick={() => handleSort('empFullName')}
                className="cursor-pointer"
              >
                Employee Details <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('companyName')}
                className="cursor-pointer"
              >
                Office Location <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('fromDate')}
                className="cursor-pointer"
              >
                From Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('toDate')}
                className="cursor-pointer"
              >
                To Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!employeeOfficeLocations ||
            employeeOfficeLocations.data === undefined ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  Loading employee office locations...
                </TableCell>
              </TableRow>
            ) : !employeeOfficeLocations.data ||
              employeeOfficeLocations.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No employee office locations found
                </TableCell>
              </TableRow>
            ) : paginatedLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No employee office locations match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedLocations.map((loc: any, index) => (
                <TableRow key={loc.employeeOfficeLocationId ?? index}>
                  <TableCell>
                    {(currentPage - 1) * locationsPerPage + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{loc.empFullName ?? '—'}</div>
                    <div className="text-xs text-gray-500">
                      {[loc.empCode, loc.departmentName, loc.designationName]
                        .filter(Boolean)
                        .join(' • ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {loc.companyName
                      ? `${loc.companyName}${loc.address ? ` - ${loc.address}` : ''}`
                      : '—'}
                  </TableCell>
                  <TableCell>{toDateInputValue(loc.fromDate) || '—'}</TableCell>
                  <TableCell>{toDateInputValue(loc.toDate) || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditClick(loc)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingLocationId(loc.employeeOfficeLocationId)
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

      {sortedLocations.length > 0 && (
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
            ? 'Edit Employee Office Location'
            : 'Add/Update Employee Office Locations'
        }
        size={`${isEditMode ? 'sm:max-w-xl' : 'sm:max-w-5xl'}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {isEditMode ? (
            // Edit Mode - Single employee selection
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 min-w-[200px]">
                <Label htmlFor="employeeId">
                  Employee <span className="text-red-500">*</span>
                </Label>
                <CustomCombobox
                  items={(employees?.data ?? [])
                    .filter((e: any) => e?.employeeId)
                    .map((e: any) => ({
                      id: String(e.employeeId),
                      name: `${e.empCode ?? ''}-${e.empFullName ?? ''}-${
                        e.departmentName ?? ''
                      }-${e.designationName ?? ''}`,
                    }))}
                  value={
                    formData.employeeId
                      ? {
                          id: String(formData.employeeId),
                          name: (() => {
                            const e = employees?.data?.find(
                              (e: any) =>
                                String(e.employeeId) ===
                                String(formData.employeeId)
                            )
                            return e
                              ? `${e.empCode ?? ''}-${e.empFullName ?? ''}-${
                                  e.departmentName ?? ''
                                }-${e.designationName ?? ''}`
                              : ''
                          })(),
                        }
                      : null
                  }
                  onChange={(value) =>
                    handleSelectChange(
                      'employeeId',
                      value ? String(value.id) : ''
                    )
                  }
                  placeholder="Select employee"
                />
              </div>

              <div className="space-y-2 col-span-2 min-w-[200px]">
                <Label htmlFor="officeLocationId">
                  Office Location <span className="text-red-500">*</span>
                </Label>
                <CustomCombobox
                  items={(officeLocations?.data ?? [])
                    .filter((o: any) => o?.officeLocationId)
                    .map((o: any) => ({
                      id: String(o.officeLocationId),
                      name: `${o.companyName ?? ''}-${o.address ?? ''}`,
                    }))}
                  value={
                    formData.officeLocationId
                      ? {
                          id: String(formData.officeLocationId),
                          name: (() => {
                            const o = officeLocations?.data?.find(
                              (o: any) =>
                                String(o.officeLocationId) ===
                                String(formData.officeLocationId)
                            )
                            return o
                              ? `${o.companyName ?? ''}-${o.address ?? ''}`
                              : ''
                          })(),
                        }
                      : null
                  }
                  onChange={(value) =>
                    handleSelectChange(
                      'officeLocationId',
                      value ? String(value.id) : ''
                    )
                  }
                  placeholder="Select office location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromDate">
                  From Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fromDate"
                  name="fromDate"
                  type="date"
                  value={toDateInputValue(formData.fromDate)}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  name="toDate"
                  type="date"
                  value={toDateInputValue(formData.toDate)}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          ) : (
            // Bulk Add/Update Mode
            <>
              {/* View Mode Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showOnlyUnassigned"
                  checked={showOnlyUnassigned}
                  onCheckedChange={(checked) =>
                    setShowOnlyUnassigned(!!checked)
                  }
                />
                <Label
                  htmlFor="showOnlyUnassigned"
                  className="text-sm font-medium cursor-pointer"
                >
                  Show only unassigned employees
                </Label>
              </div>

              {/* Bulk Employee Table */}
              <div className="border rounded-md max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="bg-gray-50 sticky top-0">
                    <TableRow>
                      <TableHead className="min-w-[200px]">
                        Employee Details
                      </TableHead>
                      <TableHead className="min-w-[250px]">
                        Office Location *
                      </TableHead>
                      <TableHead className="min-w-[150px]">
                        From Date *
                      </TableHead>
                      <TableHead className="min-w-[150px]">To Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          {showOnlyUnassigned
                            ? 'All employees have been assigned office locations'
                            : 'No employees found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredEmployees.map((emp) => (
                        <TableRow key={emp.employeeId}>
                          <TableCell>
                            <div className="font-medium">
                              {emp.empFullName || '—'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {[
                                emp.empCode,
                                emp.departmentName,
                                emp.designationName,
                              ]
                                .filter(Boolean)
                                .join(' • ')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <CustomCombobox
                              items={(officeLocations?.data ?? [])
                                .filter((o: any) => o?.officeLocationId)
                                .map((o: any) => ({
                                  id: String(o.officeLocationId),
                                  name: `${o.companyName ?? ''} - ${o.address ?? ''}`,
                                }))}
                              value={
                                emp.officeLocationId
                                  ? {
                                      id: String(emp.officeLocationId),
                                      name: (() => {
                                        const o = officeLocations?.data?.find(
                                          (o: any) =>
                                            String(o.officeLocationId) ===
                                            String(emp.officeLocationId)
                                        )
                                        return o
                                          ? `${o.companyName ?? ''} - ${o.address ?? ''}`
                                          : ''
                                      })(),
                                    }
                                  : null
                              }
                              onChange={(value) =>
                                handleBulkOfficeLocationChange(
                                  emp.employeeId,
                                  value ? String(value.id) : ''
                                )
                              }
                              placeholder="Select office location"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={toDateInputValue(emp.fromDate)}
                              onChange={(e) =>
                                handleBulkDateChange(
                                  emp.employeeId,
                                  'fromDate',
                                  e.target.value
                                )
                              }
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={toDateInputValue(emp.toDate)}
                              onChange={(e) =>
                                handleBulkDateChange(
                                  emp.employeeId,
                                  'toDate',
                                  e.target.value
                                )
                              }
                              className="w-full"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="text-sm text-gray-500">
                {
                  getFilteredEmployees.filter(
                    (emp) => emp.officeLocationId && emp.fromDate
                  ).length
                }{' '}
                employee(s) have data to save
                {showOnlyUnassigned && ' (showing unassigned only)'}
              </div>
            </>
          )}

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
            <AlertDialogTitle>Delete Employee Office Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee office location?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingLocationId) {
                  deleteMutation.mutate({ id: deletingLocationId })
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

export default EmployeeOfficeLocations
