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
  ArrowUpDown,
  Search,
  Banknote,
  Trash2,
  SkipForward,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateEmployeeLoneType, GetEmployeeLoneType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useQueryClient } from '@tanstack/react-query'
import {
  useAddLone,
  useDeleteLone,
  useGetAllEmployees,
  useGetLones,
  useSkipLone,
  useUpdateLone,
  useMakeEmployeeLoneFullPaid,
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

// Helper: check if a lone installment (loneInstallmentYear/loneInstallmentMonth) is current or future
const isCurrentOrFuture = (
  loneInstallmentYear: number,
  loneInstallmentMonth: string
): boolean => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-based

  const monthMap: Record<string, number> = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  }
  const instMonth =
    monthMap[loneInstallmentMonth] ?? parseInt(loneInstallmentMonth, 10)

  if (loneInstallmentYear > currentYear) return true
  if (loneInstallmentYear === currentYear && instMonth >= currentMonth)
    return true
  return false
}

const EmployeeLones = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const queryClient = useQueryClient()

  const { data: lones } = useGetLones()
  const { data: employees } = useGetAllEmployees()
  console.log('🚀 ~ EmployeeLones ~ employees:', employees)

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [lonesPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetEmployeeLoneType>('empFullName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingLoneId, setEditingLoneId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingLoneId, setDeletingLoneId] = useState<number | null>(null)

  // Skip lone state
  const [isSkipDialogOpen, setIsSkipDialogOpen] = useState(false)
  const [skippingInstallment, setSkippingInstallment] = useState<{
    employeeLoneInstallmentId: number
    loneInstallmentMonth: string
    loneInstallmentYear: number
  } | null>(null)

  // Full-paid lone state
  const [isFullPaidDialogOpen, setIsFullPaidDialogOpen] = useState(false)
  const [payingLoneId, setPayingLoneId] = useState<number | null>(null)

  // Track which lone accordion rows are expanded
  const [expandedLoneIds, setExpandedLoneIds] = useState<Set<number>>(new Set())

  const [formData, setFormData] = useState<CreateEmployeeLoneType>({
    employeeLoneName: '',
    loneDate: '',
    employeeId: 0,
    amount: 0,
    perMonth: 0,
    description: '',
    createdBy: userData?.userId || 0,
  })

  const employeeItems = useMemo(() => {
    if (!employees?.data) return []
    return employees.data.map((emp: any) => ({
      id: emp.employeeId.toString(),
      name: `${emp.empCode} - ${emp.empFullName} - ${emp.departmentName} - ${emp.designationName}`,
    }))
  }, [employees?.data])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value,
    }))
  }

  const resetForm = useCallback(() => {
    setFormData({
      employeeLoneName: '',
      loneDate: '',
      employeeId: 0,
      amount: 0,
      perMonth: 0,
      description: '',
      createdBy: userData?.userId || 0,
    })
    setEditingLoneId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
    queryClient.invalidateQueries({ queryKey: ['lones'] })
  }, [resetForm, queryClient])

  const addMutation = useAddLone({ onClose: closePopup, reset: resetForm })
  const updateMutation = useUpdateLone({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteLone({
    onClose: closePopup,
    reset: resetForm,
  })
  const skipMutation = useSkipLone({
    onClose: () => setIsSkipDialogOpen(false),
    reset: () => setSkippingInstallment(null),
  })
  const fullPaidMutation = useMakeEmployeeLoneFullPaid({
    onClose: () => setIsFullPaidDialogOpen(false),
    reset: () => setPayingLoneId(null),
  })

  const handleSort = (column: keyof GetEmployeeLoneType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredLones = useMemo(() => {
    if (!lones?.data) return []
    return lones.data.filter(
      (lone: GetEmployeeLoneType) =>
        lone.empFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lone.empCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lone.employeeLoneName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        lone.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lone.designationName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [lones?.data, searchTerm])

  const sortedLones = useMemo(() => {
    return [...filteredLones].sort((a, b) => {
      const aValue = (a[sortColumn] ?? '') as string
      const bValue = (b[sortColumn] ?? '') as string
      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })
  }, [filteredLones, sortColumn, sortDirection])

  const paginatedLones = useMemo(() => {
    const startIndex = (currentPage - 1) * lonesPerPage
    return sortedLones.slice(startIndex, startIndex + lonesPerPage)
  }, [sortedLones, currentPage, lonesPerPage])

  const totalPages = Math.ceil(sortedLones.length / lonesPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      try {
        const submitData: CreateEmployeeLoneType = {
          employeeLoneName: formData.employeeLoneName,
          loneDate: formData.loneDate,
          employeeId: formData.employeeId,
          amount: formData.amount,
          perMonth: Number(formData.perMonth),
          description: formData.description,
          createdBy: formData.createdBy,
        }
        if (isEditMode) {
          submitData.updatedBy = userData?.userId || 0
        } else {
          submitData.createdBy = userData?.userId || 0
        }
        if (isEditMode && editingLoneId) {
          updateMutation.mutate({
            id: editingLoneId,
            data: submitData as GetEmployeeLoneType,
          })
        } else {
          addMutation.mutate(submitData)
        }
      } catch (err) {
        setError('Failed to save lone')
        console.error(err)
      }
    },
    [formData, isEditMode, editingLoneId, addMutation, updateMutation, userData]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving lone')
    }
  }, [addMutation.error, updateMutation.error])

  const toggleAccordion = (loneId: number) => {
    setExpandedLoneIds((prev) => {
      const next = new Set(prev)
      if (next.has(loneId)) {
        next.delete(loneId)
      } else {
        next.add(loneId)
      }
      return next
    })
  }

  const handleSkipClick = (installment: any) => {
    setSkippingInstallment({
      employeeLoneInstallmentId: installment.employeeLoneInstallmentId,
      loneInstallmentMonth: installment.loneInstallmentMonth,
      loneInstallmentYear: installment.loneInstallmentYear,
    })
    setIsSkipDialogOpen(true)
  }

  const handleSkipConfirm = () => {
    if (skippingInstallment) {
      skipMutation.mutate({
        employeeLoneInstallmentId:
          skippingInstallment.employeeLoneInstallmentId,
        updatedBy: userData?.userId || 0,
      })
    }
  }

  const handleFullPaidClick = (loneId: number) => {
    setPayingLoneId(loneId)
    setIsFullPaidDialogOpen(true)
  }

  const handleFullPaidConfirm = () => {
    if (payingLoneId) {
      fullPaidMutation.mutate({ id: payingLoneId })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <Banknote className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Employee Lones</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search lones..."
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
              <TableHead className="w-8" />
              <TableHead>Sl No.</TableHead>
              <TableHead
                onClick={() => handleSort('empFullName')}
                className="cursor-pointer"
              >
                Employee Details <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('employeeLoneName')}
                className="cursor-pointer"
              >
                Lone Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('loneDate')}
                className="cursor-pointer"
              >
                Lone Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('amount')}
                className="cursor-pointer"
              >
                Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('perMonth')}
                className="cursor-pointer"
              >
                Per Month <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Paid / Remaining</TableHead>
              <TableHead
                onClick={() => handleSort('description')}
                className="cursor-pointer"
              >
                Description <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!lones || lones.data === undefined ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-4">
                  Loading lones...
                </TableCell>
              </TableRow>
            ) : !lones.data || lones.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-4">
                  No lones found
                </TableCell>
              </TableRow>
            ) : paginatedLones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-4">
                  No lones match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedLones.map((lone, index) => {
                const loneId = lone.employeeLoneId ?? -1
                const loneInstallments = lone.installments ?? []
                const isExpanded = expandedLoneIds.has(loneId)
                const isFullyPaid = Number(lone.remainingBalance) <= 0

                return (
                  <React.Fragment key={loneId}>
                    {/* Main lone row */}
                    <TableRow
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        loneInstallments.length > 0 && toggleAccordion(loneId)
                      }
                    >
                      <TableCell className="w-8">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-6 w-6"
                          disabled={loneInstallments.length === 0}
                          onClick={() => toggleAccordion(loneId)}
                          title={
                            loneInstallments.length === 0
                              ? 'No installments'
                              : isExpanded
                                ? 'Collapse installments'
                                : 'View installments'
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ChevronRight
                              className={`h-4 w-4 ${
                                loneInstallments.length === 0
                                  ? 'text-gray-200'
                                  : 'text-gray-400'
                              }`}
                            />
                          )}
                        </Button>
                      </TableCell>

                      <TableCell>
                        {(currentPage - 1) * lonesPerPage + index + 1}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">
                            {lone.empFullName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {lone.empCode}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {lone.departmentName} · {lone.designationName}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>{lone.employeeLoneName}</TableCell>
                      <TableCell>{lone.loneDate}</TableCell>
                      <TableCell>{lone.amount}</TableCell>
                      <TableCell>{lone.perMonth}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="text-blue-700 font-medium">
                            Paid: {lone.totalPaid}
                          </span>
                          <span className="text-muted-foreground">
                            Remaining: {lone.remainingBalance}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{lone.description}</TableCell>

                      <TableCell>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            isFullyPaid
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-yellow-100 text-gray-600'
                          }`}
                        >
                          {isFullyPaid ? 'Paid' : 'Pending'}
                        </span>
                      </TableCell>

                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-7 px-2 text-xs ${
                            isFullyPaid
                              ? 'text-gray-400'
                              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                          }`}
                          disabled={isFullyPaid}
                          onClick={() => handleFullPaidClick(loneId)}
                        >
                          Pay Full
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Accordion: installments sub-table */}
                    {isExpanded && loneInstallments.length > 0 && (
                      <TableRow className="bg-blue-50/60">
                        <TableCell colSpan={12} className="p-0">
                          <div className="px-8 py-3">
                            <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">
                              Installments for {lone.employeeLoneName} (
                              {lone.totalInstallments} total)
                            </p>

                            <Table>
                              <TableHeader>
                                <TableRow className="bg-blue-100/70">
                                  <TableHead className="py-2 text-xs">
                                    Sl No.
                                  </TableHead>
                                  <TableHead className="py-2 text-xs">
                                    Installment Month
                                  </TableHead>
                                  <TableHead className="py-2 text-xs">
                                    Installment Year
                                  </TableHead>
                                  <TableHead className="py-2 text-xs">
                                    Amount
                                  </TableHead>
                                  <TableHead className="py-2 text-xs">
                                    Status
                                  </TableHead>
                                  <TableHead className="py-2 text-xs text-right">
                                    Action
                                  </TableHead>
                                </TableRow>
                              </TableHeader>

                              <TableBody>
                                {loneInstallments.map((inst, instIdx) => {
                                  const alreadySkipped = !!inst.isSkipped
                                  const canSkip =
                                    !alreadySkipped &&
                                    !inst.isPaid &&
                                    isCurrentOrFuture(
                                      inst.loneInstallmentYear,
                                      inst.loneInstallmentMonth
                                    )

                                  return (
                                    <TableRow
                                      key={inst.employeeLoneInstallmentId}
                                      className={`text-sm`}
                                    >
                                      <TableCell className="py-2 text-xs">
                                        {instIdx + 1}
                                      </TableCell>

                                      <TableCell className="py-2 text-xs">
                                        {inst.loneInstallmentMonth}
                                      </TableCell>

                                      <TableCell className="py-2 text-xs">
                                        {inst.loneInstallmentYear}
                                      </TableCell>

                                      <TableCell className="py-2 text-xs">
                                        {inst.amount}
                                      </TableCell>

                                      <TableCell className="py-2 text-xs">
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                            alreadySkipped
                                              ? 'bg-orange-100 text-orange-700'
                                              : inst.isPaid
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-yellow-100 text-gray-500'
                                          }`}
                                        >
                                          {alreadySkipped
                                            ? 'Skipped'
                                            : inst.isPaid
                                              ? 'Paid'
                                              : 'Pending'}
                                        </span>
                                      </TableCell>

                                      <TableCell className="py-2 text-xs text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={`h-7 px-2 text-xs ${
                                            canSkip
                                              ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                              : 'text-gray-500 cursor-not-allowed'
                                          }`}
                                          disabled={!canSkip}
                                          title={
                                            inst.isPaid
                                              ? 'Paid installments cannot be skipped'
                                              : undefined
                                          }
                                          onClick={() =>
                                            canSkip && handleSkipClick(inst)
                                          }
                                        >
                                          <SkipForward className="h-3.5 w-3.5 mr-1" />
                                          Skip
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
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

      {sortedLones.length > 0 && (
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
                    <PaginationItem key={index}>
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
                    <PaginationItem key={`e-${index}`}>
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
        title={isEditMode ? 'Edit Lone' : 'Add Lone'}
        size="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeLoneName">
                  Lone Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="employeeLoneName"
                  name="employeeLoneName"
                  value={formData.employeeLoneName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loneDate">
                  Lone Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="loneDate"
                  name="loneDate"
                  type="date"
                  value={formData.loneDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min={0}
                  value={formData.amount || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perMonth">
                  Per Month <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="perMonth"
                  name="perMonth"
                  type="number"
                  min={0}
                  value={formData.perMonth || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
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

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lone? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingLoneId) {
                  deleteMutation.mutate({ id: deletingLoneId })
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

      {/* Skip Installment Alert Dialog */}
      <AlertDialog open={isSkipDialogOpen} onOpenChange={setIsSkipDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Skip Lone Installment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to skip the{' '}
              <strong>
                {skippingInstallment?.loneInstallmentMonth}{' '}
                {skippingInstallment?.loneInstallmentYear}
              </strong>{' '}
              installment? This will defer the installment to the next month.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel
              onClick={() => {
                setIsSkipDialogOpen(false)
                setSkippingInstallment(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSkipConfirm}
              disabled={skipMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {skipMutation.isPending ? 'Skipping...' : 'Skip Installment'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay Full Alert Dialog */}
      <AlertDialog
        open={isFullPaidDialogOpen}
        onOpenChange={setIsFullPaidDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Pay Full Lone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this lone as fully paid? This will
              settle all remaining installments and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel
              onClick={() => {
                setIsFullPaidDialogOpen(false)
                setPayingLoneId(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFullPaidConfirm}
              disabled={fullPaidMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {fullPaidMutation.isPending ? 'Processing...' : 'Pay Full'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default EmployeeLones
