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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpDown, Search, Coins, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateOtherSalaryComponentType,
  GetOtherSalaryComponentType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddOtherSalaryComponent,
  useDeleteOtherSalaryComponent,
  useGetOtherSalaryComponents,
  useUpdateOtherSalaryComponent,
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

const OtherSalaryComponents = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: otherSalaryComponents } = useGetOtherSalaryComponents()
  console.log(
    '🚀 ~ OtherSalaryComponents ~ otherSalaryComponents:',
    otherSalaryComponents
  )

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [componentsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetOtherSalaryComponentType>('componentName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingComponentId, setEditingComponentId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingComponentId, setDeletingComponentId] = useState<number | null>(
    null
  )

  const getDefaultForm = useCallback(
    (): CreateOtherSalaryComponentType => ({
      componentName: '',
      componentType: 'Allowance',
      amount: 0,
      forDays: 0,
      status: 1,
      isAbsentFee: 0,
      isLoneFee: 0,
      isLateEarlyOutFee: 0,
      createdBy: userData?.userId || 0,
    }),
    [userData?.userId]
  )

  const [formData, setFormData] =
    useState<CreateOtherSalaryComponentType>(getDefaultForm)

  // Derived: is isLoneFee checked — hides amount & forDays
  const isLoneFeeChecked = formData.isLoneFee === 1
  const isAbsentFeeChecked = formData.isAbsentFee === 1
  const isLateEarlyOutFeehecked = formData.isLateEarlyOutFee === 1

  // Check if any existing record already has isAbsentFee or isLoneFee = 1
  // excluding the currently edited record
  const existingAbsentFee = useMemo(() => {
    return (
      otherSalaryComponents?.data?.some(
        (c) =>
          c.isAbsentFee === 1 && c.otherSalaryComponentId !== editingComponentId
      ) ?? false
    )
  }, [otherSalaryComponents?.data, editingComponentId])

  const existingLoneFee = useMemo(() => {
    return (
      otherSalaryComponents?.data?.some(
        (c) =>
          c.isLoneFee === 1 && c.otherSalaryComponentId !== editingComponentId
      ) ?? false
    )
  }, [otherSalaryComponents?.data, editingComponentId])

  const existingisLateEarlyOutFee = useMemo(() => {
    return (
      otherSalaryComponents?.data?.some(
        (c) =>
          c.isLateEarlyOutFee === 1 &&
          c.otherSalaryComponentId !== editingComponentId
      ) ?? false
    )
  }, [otherSalaryComponents?.data, editingComponentId])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (
    field: 'isAbsentFee' | 'isisLateEarlyOutFee' | 'isLoneFee',
    checked: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      isAbsentFee:
        field === 'isAbsentFee' ? (checked ? 1 : 0) : prev.isAbsentFee,
      isLateEarlyOutFee:
        field === 'isisLateEarlyOutFee'
          ? checked
            ? 1
            : 0
          : prev.isLateEarlyOutFee,
      isLoneFee: field === 'isLoneFee' ? (checked ? 1 : 0) : prev.isLoneFee,
      // Reset amount/forDays to 0 when switching to LoneFee
      ...(field === 'isLoneFee' && checked ? { amount: 0, forDays: 0 } : {}),
    }))
  }

  const resetForm = useCallback(() => {
    setFormData(getDefaultForm())
    setEditingComponentId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [getDefaultForm])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddOtherSalaryComponent({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateOtherSalaryComponent({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteOtherSalaryComponent({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetOtherSalaryComponentType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredComponents = useMemo(() => {
    if (!otherSalaryComponents?.data) return []
    return otherSalaryComponents.data.filter((comp) =>
      comp.componentName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [otherSalaryComponents?.data, searchTerm])

  const sortedComponents = useMemo(() => {
    return [...filteredComponents].sort((a, b) => {
      const aValue = a[sortColumn] ?? ''
      const bValue = b[sortColumn] ?? ''
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      return 0
    })
  }, [filteredComponents, sortColumn, sortDirection])

  const paginatedComponents = useMemo(() => {
    const startIndex = (currentPage - 1) * componentsPerPage
    return sortedComponents.slice(startIndex, startIndex + componentsPerPage)
  }, [sortedComponents, currentPage, componentsPerPage])

  const totalPages = Math.ceil(sortedComponents.length / componentsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      // Guard: only one isAbsentFee and one isLoneFee allowed
      if (formData.isAbsentFee === 1 && existingAbsentFee) {
        setError('An absent fee component already exists. Only one is allowed.')
        return
      }
      if (formData.isLoneFee === 1 && existingLoneFee) {
        setError('A lone fee component already exists. Only one is allowed.')
        return
      }

      try {
        const submitData: CreateOtherSalaryComponentType = {
          componentName: formData.componentName,
          componentType: formData.componentType,
          // Force 0 for amount/forDays when isLoneFee is checked
          amount: isLoneFeeChecked ? 0 : Number(formData.amount),
          forDays: isLoneFeeChecked ? 0 : Number(formData.forDays),
          status: formData.status,
          isAbsentFee: formData.isAbsentFee,
          isLoneFee: formData.isLoneFee,
          isLateEarlyOutFee: formData.isLateEarlyOutFee,
          createdBy: userData?.userId || 0,
        }

        if (isEditMode) {
          submitData.updatedBy = userData?.userId || 0
        }

        if (isEditMode && editingComponentId) {
          updateMutation.mutate({ id: editingComponentId, data: submitData })
        } else {
          addMutation.mutate(submitData)
        }
      } catch (err) {
        setError('Failed to save salary component')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingComponentId,
      isLoneFeeChecked,
      existingAbsentFee,
      existingLoneFee,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving salary component')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (comp: any) => {
    setFormData({
      componentName: comp.componentName,
      componentType: comp.componentType,
      amount: Number(comp.amount),
      forDays: Number(comp.forDays),
      status: comp.status,
      isAbsentFee: comp.isAbsentFee ?? 0,
      isLoneFee: comp.isLoneFee ?? 0,
      isLateEarlyOutFee: comp.isLateEarlyOutFee ?? 0,
      createdBy: userData?.userId || 0,
    })
    setEditingComponentId(comp.otherSalaryComponentId)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <Coins className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Other Salary Components</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search components..."
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

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead
                onClick={() => handleSort('componentName')}
                className="cursor-pointer"
              >
                Component Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('amount')}
                className="cursor-pointer"
              >
                Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('forDays')}
                className="cursor-pointer"
              >
                For Days <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('componentType')}
                className="cursor-pointer"
              >
                Type <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Absent Fee</TableHead>
              <TableHead>Lone Fee</TableHead>
              <TableHead>Late/Early Out Fee</TableHead>
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
            {!otherSalaryComponents ||
            otherSalaryComponents.data === undefined ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  Loading salary components...
                </TableCell>
              </TableRow>
            ) : !otherSalaryComponents.data ||
              otherSalaryComponents.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No salary components found
                </TableCell>
              </TableRow>
            ) : paginatedComponents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No salary components match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedComponents.map((comp: any, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {comp.componentName}
                  </TableCell>
                  <TableCell className="font-medium">
                    {comp.isLoneFee ? '-' : `${comp.amount}%`}
                  </TableCell>
                  <TableCell className="font-medium">
                    {comp.isLoneFee ? '-' : comp.forDays}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        comp.componentType === 'Allowance'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {comp.componentType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        comp.isAbsentFee === 1
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {comp.isAbsentFee === 1 ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        comp.isLoneFee === 1
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {comp.isLoneFee === 1 ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        comp.isLateEarlyOutFee === 1
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {comp.isLateEarlyOutFee === 1 ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        comp.status === 1
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {comp.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(comp)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingComponentId(comp.otherSalaryComponentId)
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

      {sortedComponents.length > 0 && (
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
        title={isEditMode ? 'Edit Salary Component' : 'Add Salary Component'}
        size="sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="componentName">
                Component Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="componentName"
                name="componentName"
                value={formData.componentName}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isAbsentFee"
                  checked={isAbsentFeeChecked}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('isAbsentFee', checked === true)
                  }
                  disabled={existingAbsentFee && !isAbsentFeeChecked}
                />
                <Label htmlFor="isAbsentFee" className="cursor-pointer">
                  Absent Fee
                </Label>
                {existingAbsentFee && !isAbsentFeeChecked && (
                  <span className="text-xs text-gray-400">(already set)</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isisLateEarlyOutFee"
                  checked={isLateEarlyOutFeehecked}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(
                      'isisLateEarlyOutFee',
                      checked === true
                    )
                  }
                  disabled={
                    existingisLateEarlyOutFee && !isLateEarlyOutFeehecked
                  }
                />
                <Label htmlFor="isisLateEarlyOutFee" className="cursor-pointer">
                  Late/Early Out Fee
                </Label>
                {existingisLateEarlyOutFee && !isLateEarlyOutFeehecked && (
                  <span className="text-xs text-gray-400">(already set)</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isLoneFee"
                  checked={isLoneFeeChecked}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('isLoneFee', checked === true)
                  }
                  disabled={existingLoneFee && !isLoneFeeChecked}
                />
                <Label htmlFor="isLoneFee" className="cursor-pointer">
                  Lone Fee
                </Label>
                {existingLoneFee && !isLoneFeeChecked && (
                  <span className="text-xs text-gray-400">(already set)</span>
                )}
              </div>
            </div>

            {/* Amount & ForDays — hidden when isLoneFee is checked */}
            {!isLoneFeeChecked && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Amount (%) <span className="text-red-500">*</span>
                  </Label>
                  <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-md border">
                    <p className="font-medium mb-1">
                      Percentage of the employee&apos;s basic salary
                    </p>
                  </div>
                  <Input
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forDays">
                    For Days <span className="text-red-500">*</span>
                  </Label>

                  <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-md border">
                    <p className="font-medium mb-1">Frequency setting:</p>
                    <p>0 → Always add this fee (no skipping)</p>
                    <p>1 → Add → Skip → Add → Skip (adds every other time)</p>
                    <p>
                      2 → Add → Skip → Skip → Add → Skip → Skip (adds every 3rd
                      time)
                    </p>
                  </div>

                  <Input
                    id="forDays"
                    name="forDays"
                    type="number"
                    min="0"
                    value={formData.forDays}
                    onChange={handleInputChange}
                    placeholder="Enter 0, 1, or 2"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="componentType">
                Component Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.componentType}
                onValueChange={(value) =>
                  handleSelectChange('componentType', value)
                }
              >
                <SelectTrigger id="componentType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Allowance">Allowance</SelectItem>
                  <SelectItem value="Deduction">Deduction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={String(formData.status)}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: Number(value) }))
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
            <AlertDialogTitle>Delete Salary Component</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this salary component? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingComponentId) {
                  deleteMutation.mutate({ id: deletingComponentId })
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

export default OtherSalaryComponents
