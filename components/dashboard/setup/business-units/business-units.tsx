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
import { ArrowUpDown, Search, Building2, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import { CustomCombobox } from '@/utils/custom-combobox'
import type {
  CreateBusinessUnitType,
  GetBusinessUnitType,
  GetEmploymentType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddBusinessUnit,
  useDeleteBusinessUnit,
  useGetBusinessUnits,
  useUpdateBusinessUnit,
  useGetAllEmployees,
  useGetCompanies,
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
import CustomSwitch from '@/utils/custom-switch'

const BusinessUnits = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: businessUnits } = useGetBusinessUnits()
  const { data: employees } = useGetAllEmployees()
  const { data: companies } = useGetCompanies()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [businessUnitsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetBusinessUnitType>('unitName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingBusinessUnitId, setEditingBusinessUnitId] = useState<
    number | null
  >(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingBusinessUnitId, setDeletingBusinessUnitId] = useState<
    number | null
  >(null)

  const [formData, setFormData] = useState<CreateBusinessUnitType>({
    companyId: 0,
    unitName: '',
    unitCode: '',
    description: '',
    headEmployeeId: null,
    status: true,
    createdBy: userData?.userId || 0,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value === '0' ? null : Number(value),
    }))
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, status: e.target.checked }))
  }

  const resetForm = useCallback(() => {
    setFormData({
      companyId: 0,
      unitName: '',
      unitCode: '',
      description: '',
      headEmployeeId: null,
      status: true,
      createdBy: userData?.userId || 0,
    })
    setEditingBusinessUnitId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddBusinessUnit({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateBusinessUnit({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteBusinessUnit({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetBusinessUnitType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredBusinessUnits = useMemo(() => {
    if (!businessUnits?.data) return []
    return businessUnits.data.filter((unit) =>
      unit.unitName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [businessUnits?.data, searchTerm])

  const sortedBusinessUnits = useMemo(() => {
    return [...filteredBusinessUnits].sort((a, b) => {
      const aValue = (a[sortColumn] ?? '') as string
      const bValue = (b[sortColumn] ?? '') as string
      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })
  }, [filteredBusinessUnits, sortDirection, sortColumn])

  const paginatedBusinessUnits = useMemo(() => {
    const startIndex = (currentPage - 1) * businessUnitsPerPage
    return sortedBusinessUnits.slice(
      startIndex,
      startIndex + businessUnitsPerPage
    )
  }, [sortedBusinessUnits, currentPage, businessUnitsPerPage])

  const totalPages = Math.ceil(
    sortedBusinessUnits.length / businessUnitsPerPage
  )

  const formatHeadEmployee = (unit: GetBusinessUnitType): string => {
    if (!unit.headEmployeeId) return '—'
    const parts = [
      unit.empCode,
      unit.empFullName,
      unit.departmentName,
      unit.designationName,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(' - ') : '—'
  }

  const buildEmployeeLabel = (emp: GetEmploymentType): string =>
    [emp.empCode, emp.empFullName, emp.departmentName, emp.designationName]
      .filter(Boolean)
      .join(' - ')

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      try {
        const submitData: CreateBusinessUnitType = { ...formData }

        if (isEditMode) {
          submitData.updatedBy = userData?.userId || 0
        } else {
          submitData.createdBy = userData?.userId || 0
        }

        if (isEditMode && editingBusinessUnitId) {
          updateMutation.mutate({
            id: editingBusinessUnitId,
            data: submitData as GetBusinessUnitType,
          })
        } else {
          addMutation.mutate(submitData)
        }
      } catch (err) {
        setError('Failed to save business unit')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingBusinessUnitId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving business unit')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (unit: GetBusinessUnitType) => {
    setFormData({
      companyId: unit.companyId,
      unitName: unit.unitName,
      unitCode: unit.unitCode ?? '',
      description: unit.description ?? '',
      headEmployeeId: unit.headEmployeeId ?? null,
      status: unit.status,
      createdBy: unit.createdBy,
      updatedBy: userData?.userId || 0,
    })
    setEditingBusinessUnitId(unit.businessUnitId ?? null)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <Building2 className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Business Units</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search business units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-amber-400 hover:bg-amber-500 text-black"
            onClick={() => setIsPopupOpen(true)}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead
                onClick={() => handleSort('unitName')}
                className="cursor-pointer"
              >
                Unit Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('unitCode')}
                className="cursor-pointer"
              >
                Unit Code <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('companyName')}
                className="cursor-pointer"
              >
                Company <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('empFullName')}
                className="cursor-pointer"
              >
                Head Employee <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('status')}
                className="cursor-pointer"
              >
                Status <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!businessUnits || businessUnits.data === undefined ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading business units...
                </TableCell>
              </TableRow>
            ) : !businessUnits.data || businessUnits.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No business units found
                </TableCell>
              </TableRow>
            ) : paginatedBusinessUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No business units match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedBusinessUnits.map((unit: GetBusinessUnitType, index) => (
                <TableRow key={unit.businessUnitId}>
                  <TableCell>
                    {(currentPage - 1) * businessUnitsPerPage + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{unit.unitName}</TableCell>
                  <TableCell>{unit.unitCode ?? '—'}</TableCell>
                  <TableCell>{unit.companyName ?? '—'}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatHeadEmployee(unit)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        unit.status
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {unit.status ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(unit)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingBusinessUnitId(unit.businessUnitId ?? null)
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

      {/* Pagination */}
      {sortedBusinessUnits.length > 0 && (
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

      {/* Add / Edit Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Business Unit' : 'Add Business Unit'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="companyId">
                Company <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  companies?.data?.map((company) => ({
                    id: (company.companyId ?? '').toString(),
                    name: company.companyName,
                  })) || []
                }
                value={
                  formData.companyId
                    ? {
                        id: formData.companyId.toString(),
                        name:
                          companies?.data?.find(
                            (c) => c.companyId === formData.companyId
                          )?.companyName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'companyId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select company"
              />
            </div>

            {/* Unit Name */}
            <div className="space-y-2">
              <Label htmlFor="unitName">
                Unit Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unitName"
                name="unitName"
                value={formData.unitName}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Unit Code */}
            <div className="space-y-2">
              <Label htmlFor="unitCode">Unit Code</Label>
              <Input
                id="unitCode"
                name="unitCode"
                value={formData.unitCode ?? ''}
                onChange={handleInputChange}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description ?? ''}
                onChange={handleInputChange}
              />
            </div>

            {/* Head Employee */}
            <div className="space-y-2">
              <Label htmlFor="headEmployeeId">Head Employee</Label>
              <CustomCombobox
                items={
                  employees?.data?.map((emp: GetEmploymentType) => ({
                    id: emp.employeeId!.toString(),
                    name: buildEmployeeLabel(emp),
                  })) || []
                }
                value={
                  formData.headEmployeeId
                    ? {
                        id: formData.headEmployeeId.toString(),
                        name: (() => {
                          const matched = employees?.data?.find(
                            (emp: GetEmploymentType) =>
                              emp.employeeId === formData.headEmployeeId
                          )
                          return matched
                            ? buildEmployeeLabel(matched)
                            : formData.headEmployeeId.toString()
                        })(),
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'headEmployeeId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select head employee"
              />
            </div>

            {/* Status */}
            <CustomSwitch
              label="Status"
              checked={formData.status}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  status: value,
                }))
              }
            />
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

      {/* Delete Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this business unit? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingBusinessUnitId) {
                  deleteMutation.mutate({ id: deletingBusinessUnitId })
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

export default BusinessUnits
