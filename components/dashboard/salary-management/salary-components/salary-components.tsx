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
  CreateSalaryComponentType,
  GetSalaryComponentType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddSalaryComponent,
  useDeleteSalaryComponent,
  useGetSalaryComponents,
  useUpdateSalaryComponent,
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

const SalaryComponents = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: salaryComponents } = useGetSalaryComponents()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [componentsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetSalaryComponentType>('componentName')
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
    (): CreateSalaryComponentType => ({
      componentName: '',
      componentCode: '',
      calculationType: 'Fixed',
      amount: undefined,
      percentage: undefined,
      formulaExpression: undefined,
      taxable: false,
      componentType: 'Allowance',
      affectGross: false,
      affectNet: false,
      sequenceNo: 0,
      createdBy: userData?.userId || 0,
    }),
    [userData?.userId]
  )

  const [formData, setFormData] =
    useState<CreateSalaryComponentType>(getDefaultForm)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? undefined : Number(value),
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    // When calculationType changes, clear the fields that no longer apply
    if (name === 'calculationType') {
      setFormData((prev) => ({
        ...prev,
        calculationType: value as 'Fixed' | 'Percentage' | 'Formula',
        amount: undefined,
        percentage: undefined,
        formulaExpression: undefined,
      }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (
    field: 'taxable' | 'affectGross' | 'affectNet',
    checked: boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: checked }))
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

  const addMutation = useAddSalaryComponent({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateSalaryComponent({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteSalaryComponent({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetSalaryComponentType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredComponents = useMemo(() => {
    if (!salaryComponents?.data) return []
    return salaryComponents.data.filter((comp) =>
      comp.componentName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [salaryComponents?.data, searchTerm])

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

      if (!formData.componentCode.trim()) {
        setError('Component code is required.')
        return
      }

      // Validate that the relevant calculation field is filled
      if (formData.calculationType === 'Fixed' && formData.amount == null) {
        setError('Amount is required for Fixed calculation type.')
        return
      }
      if (
        formData.calculationType === 'Percentage' &&
        formData.percentage == null
      ) {
        setError('Percentage is required for Percentage calculation type.')
        return
      }
      if (
        formData.calculationType === 'Formula' &&
        !formData.formulaExpression?.trim()
      ) {
        setError('Formula expression is required for Formula calculation type.')
        return
      }

      try {
        const submitData: CreateSalaryComponentType = {
          componentName: formData.componentName,
          componentCode: formData.componentCode,
          calculationType: formData.calculationType,
          amount:
            formData.calculationType === 'Fixed' ? formData.amount : undefined,
          percentage:
            formData.calculationType === 'Percentage'
              ? formData.percentage
              : undefined,
          formulaExpression:
            formData.calculationType === 'Formula'
              ? formData.formulaExpression
              : undefined,
          taxable: formData.taxable,
          componentType: formData.componentType,
          affectGross: formData.affectGross,
          affectNet: formData.affectNet,
          sequenceNo: Number(formData.sequenceNo),
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

  const handleEditClick = (comp: GetSalaryComponentType) => {
    setFormData({
      componentName: comp.componentName,
      componentCode: comp.componentCode,
      calculationType: comp.calculationType,
      amount: comp.amount,
      percentage: comp.percentage,
      formulaExpression: comp.formulaExpression,
      taxable: comp.taxable ?? false,
      componentType: comp.componentType,
      affectGross: comp.affectGross ?? false,
      affectNet: comp.affectNet ?? false,
      sequenceNo: comp.sequenceNo,
      createdBy: userData?.userId || 0,
    })
    setEditingComponentId(comp.salaryComponentId ?? null)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  // Helper to display the calculation value in the table
  const getCalculationDisplay = (comp: GetSalaryComponentType) => {
    if (comp.calculationType === 'Fixed') {
      return comp.amount != null ? `${comp.amount} BDT` : '-'
    }
    if (comp.calculationType === 'Percentage') {
      return comp.percentage != null ? `${comp.percentage}%` : '-'
    }
    if (comp.calculationType === 'Formula') {
      return comp.formulaExpression ?? '-'
    }
    return '-'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <Coins className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Salary Components</h2>
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
                onClick={() => handleSort('componentCode')}
                className="cursor-pointer"
              >
                Code <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('calculationType')}
                className="cursor-pointer"
              >
                Calc. Type <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Value</TableHead>
              <TableHead
                onClick={() => handleSort('componentType')}
                className="cursor-pointer"
              >
                Type <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('sequenceNo')}
                className="cursor-pointer"
              >
                Seq. No <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Taxable</TableHead>
              <TableHead>Affect Gross</TableHead>
              <TableHead>Affect Net</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!salaryComponents || salaryComponents.data === undefined ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">
                  Loading salary components...
                </TableCell>
              </TableRow>
            ) : !salaryComponents.data || salaryComponents.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">
                  No salary components found
                </TableCell>
              </TableRow>
            ) : paginatedComponents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">
                  No salary components match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedComponents.map((comp, index) => (
                <TableRow key={comp.salaryComponentId ?? index}>
                  <TableCell>
                    {(currentPage - 1) * componentsPerPage + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {comp.componentName}
                  </TableCell>
                  <TableCell className="font-medium">
                    {comp.componentCode}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        comp.calculationType === 'Fixed'
                          ? 'bg-sky-100 text-sky-800'
                          : comp.calculationType === 'Percentage'
                            ? 'bg-violet-100 text-violet-800'
                            : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {comp.calculationType}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {getCalculationDisplay(comp)}
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
                  <TableCell className="font-medium">
                    {comp.sequenceNo}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        comp.taxable
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {comp.taxable ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        comp.affectGross
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {comp.affectGross ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        comp.affectNet
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {comp.affectNet ? 'Yes' : 'No'}
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
                          setDeletingComponentId(comp.salaryComponentId ?? null)
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
            {/* Component Name */}
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

            {/* Component Code */}
            <div className="space-y-2">
              <Label htmlFor="componentCode">
                Component Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="componentCode"
                name="componentCode"
                maxLength={20}
                value={formData.componentCode}
                onChange={handleInputChange}
                placeholder="Max 20 characters"
                required
              />
            </div>

            {/* Calculation Type */}
            <div className="space-y-2">
              <Label htmlFor="calculationType">
                Calculation Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.calculationType}
                onValueChange={(value) =>
                  handleSelectChange('calculationType', value)
                }
              >
                <SelectTrigger id="calculationType">
                  <SelectValue placeholder="Select calculation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed">Fixed</SelectItem>
                  <SelectItem value="Percentage">Percentage</SelectItem>
                  <SelectItem value="Formula">Formula</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional field: Fixed → Amount */}
            {formData.calculationType === 'Fixed' && (
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount ?? ''}
                  onChange={handleNumberInputChange}
                  placeholder="e.g. 5000"
                />
              </div>
            )}

            {/* Conditional field: Percentage → Percentage */}
            {formData.calculationType === 'Percentage' && (
              <div className="space-y-2">
                <Label htmlFor="percentage">
                  Percentage (%) <span className="text-red-500">*</span>
                </Label>
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md border">
                  <p className="font-medium">
                    Percentage of the employee&apos;s basic salary
                  </p>
                </div>
                <Input
                  id="percentage"
                  name="percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.percentage ?? ''}
                  onChange={handleNumberInputChange}
                  placeholder="e.g. 10"
                />
              </div>
            )}

            {/* Conditional field: Formula → Formula Expression */}
            {formData.calculationType === 'Formula' && (
              <div className="space-y-2">
                <Label htmlFor="formulaExpression">
                  Formula Expression <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="formulaExpression"
                  name="formulaExpression"
                  maxLength={255}
                  value={formData.formulaExpression ?? ''}
                  onChange={handleInputChange}
                  placeholder="e.g. basicSalary * 0.1 + 500 (max 255 chars)"
                />
              </div>
            )}

            {/* Sequence No */}
            <div className="space-y-2">
              <Label htmlFor="sequenceNo">
                Sequence No <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sequenceNo"
                name="sequenceNo"
                type="number"
                min="0"
                value={formData.sequenceNo}
                onChange={handleNumberInputChange}
                required
              />
            </div>

            {/* Component Type */}
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

            {/* Boolean Checkboxes */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="taxable"
                  checked={formData.taxable}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('taxable', checked === true)
                  }
                />
                <Label htmlFor="taxable" className="cursor-pointer">
                  Taxable
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="affectGross"
                  checked={formData.affectGross}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('affectGross', checked === true)
                  }
                />
                <Label htmlFor="affectGross" className="cursor-pointer">
                  Affect Gross
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="affectNet"
                  checked={formData.affectNet}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('affectNet', checked === true)
                  }
                />
                <Label htmlFor="affectNet" className="cursor-pointer">
                  Affect Net
                </Label>
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

export default SalaryComponents
