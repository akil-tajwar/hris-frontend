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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Search,
  Calendar,
  Users,
  BadgeDollarSign,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateEmployeeOtherSalaryComponentType,
  GetEmployeeOtherSalaryComponentType,
  GetOtherSalaryComponentType,
  GetEmployeeType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetEmployeeOtherSalaryComponents,
  useAddEmployeeOtherSalaryComponent,
  useUpdateEmployeeOtherSalaryComponent,
  useDeleteEmployeeOtherSalaryComponent,
  useGetAllEmployees,
  useGetOtherSalaryComponents,
} from '@/hooks/use-api'
import { CustomCombobox } from '@/utils/custom-combobox'

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

interface SalaryComponentFormData {
  employeeId: number
  otherSalaryComponentId: number
  salaryMonth: string
  salaryYear: number
  amount: number
  isAuthorized: number
}

const defaultFormData: SalaryComponentFormData = {
  employeeId: 0,
  otherSalaryComponentId: 0,
  salaryMonth: MONTHS[new Date().getMonth()],
  salaryYear: new Date().getFullYear(),
  amount: 0,
  isAuthorized: 1,
}

/**
 * Helper: should this deduction be counted in net salary?
 * - Always count if otherSalaryComponentId === 6 (regardless of isAuthorized)
 * - Otherwise count only if isAuthorized === 0
 */
const isDeductionCounted = (
  i: GetEmployeeOtherSalaryComponentType
): boolean => {
  if (i.componentType !== 'Deduction') return false
  if (i.isSkipped === 1) return false // ← add this line
  if (i.isLoneFee === 1) return true
  return i.isAuthorized === 0
}

const EmployeeOtherSalaryComponents = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: salaryComponents } = useGetEmployeeOtherSalaryComponents()
  const { data: employees } = useGetAllEmployees()
  console.log('🚀 ~ EmployeeOtherSalaryComponents ~ employees:', employees)
  const { data: otherSalaryComponents } = useGetOtherSalaryComponents()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [groupsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [formData, setFormData] =
    useState<SalaryComponentFormData>(defaultFormData)

  useEffect(() => {
    if (formData.employeeId && formData.otherSalaryComponentId) {
      const employee = employees?.data?.find(
        (e) => e.employeeId === formData.employeeId
      )
      const component = otherSalaryComponents?.data?.find(
        (c) => c.otherSalaryComponentId === formData.otherSalaryComponentId
      )

      if (employee?.basicSalary && component?.amount) {
        const calculatedAmount = (employee.basicSalary * component.amount) / 100
        setFormData((prev) => ({ ...prev, amount: calculatedAmount }))
      }
    }
  }, [
    formData.employeeId,
    formData.otherSalaryComponentId,
    employees?.data,
    otherSalaryComponents?.data,
  ])

  const resetForm = useCallback(() => {
    setFormData(defaultFormData)
    setEditingId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddEmployeeOtherSalaryComponent({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateEmployeeOtherSalaryComponent({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteEmployeeOtherSalaryComponent({
    onClose: closePopup,
    reset: resetForm,
  })

  const filteredComponents = useMemo(() => {
    if (!salaryComponents?.data || !Array.isArray(salaryComponents.data))
      return []
    return salaryComponents.data.filter(
      (item) =>
        item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.empCode?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [salaryComponents?.data, searchTerm])

  // Group by salaryYear + salaryMonth, then by employee
  const groupedData = useMemo(() => {
    if (!Array.isArray(filteredComponents)) return []

    const groups: Record<
      string,
      Record<string, GetEmployeeOtherSalaryComponentType[]>
    > = {}

    filteredComponents.forEach((item) => {
      const periodKey = `${item.salaryYear}-${MONTHS.indexOf(item.salaryMonth).toString().padStart(2, '0')}`
      const employeeKey = `${item.empCode}|${item.employeeName}`

      if (!groups[periodKey]) {
        groups[periodKey] = {}
      }
      if (!groups[periodKey][employeeKey]) {
        groups[periodKey][employeeKey] = []
      }
      groups[periodKey][employeeKey].push(item)
    })

    // Sort by period descending
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([periodKey, employeeGroups]) => {
        const firstItem = Object.values(employeeGroups)[0]?.[0]
        return {
          periodKey,
          periodLabel: firstItem
            ? `${firstItem.salaryMonth} ${firstItem.salaryYear}`
            : periodKey,
          employeeGroups: Object.entries(employeeGroups).map(
            ([empKey, items]) => ({
              empKey,
              empCode: items[0].empCode,
              employeeName: items[0].employeeName,
              employeeDepartmentName: items[0].employeeDepartmentName,
              employeeDesignationName: items[0].employeeDesignationName,
              items,
              totalAmount: items.reduce((sum, i) => {
                if (i.componentType === 'Allowance')
                  return sum + (i.amount || 0)
                if (isDeductionCounted(i)) return sum - (i.amount || 0)
                return sum
              }, 0),
            })
          ),
          totalAmount: Object.values(employeeGroups)
            .flat()
            .reduce((sum, i) => {
              if (i.componentType === 'Allowance') return sum + (i.amount || 0)
              if (isDeductionCounted(i)) return sum - (i.amount || 0)
              return sum
            }, 0),
          totalEmployees: Object.keys(employeeGroups).length,
          totalRecords: Object.values(employeeGroups).flat().length,
        }
      })
  }, [filteredComponents])

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * groupsPerPage
    return groupedData.slice(startIndex, startIndex + groupsPerPage)
  }, [groupedData, currentPage, groupsPerPage])

  const totalPages = Math.ceil(groupedData.length / groupsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!formData.employeeId) {
        setError('Please select an employee')
        return
      }
      if (!formData.otherSalaryComponentId) {
        setError('Please select a salary component')
        return
      }
      if (!formData.amount || formData.amount <= 0) {
        setError('Please enter a valid amount')
        return
      }

      try {
        if (isEditMode && editingId) {
          const submitData: CreateEmployeeOtherSalaryComponentType = {
            employeeId: formData.employeeId,
            otherSalaryComponentId: formData.otherSalaryComponentId,
            salaryMonth: formData.salaryMonth,
            salaryYear: formData.salaryYear,
            amount: formData.amount,
            isAuthorized: formData.isAuthorized,
            updatedBy: userData?.userId || 0,
            createdBy: userData?.userId || 0,
          }
          await updateMutation.mutateAsync({ id: editingId, data: submitData })
        } else {
          const submitData: CreateEmployeeOtherSalaryComponentType = {
            employeeId: formData.employeeId,
            otherSalaryComponentId: formData.otherSalaryComponentId,
            salaryMonth: formData.salaryMonth,
            salaryYear: formData.salaryYear,
            amount: formData.amount,
            isAuthorized: formData.isAuthorized,
            createdBy: userData?.userId || 0,
          }
          await addMutation.mutateAsync(submitData)
        }
      } catch (err) {
        setError('Failed to save salary component')
        console.error(err)
      }
    },
    [formData, isEditMode, editingId, addMutation, updateMutation, userData]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving salary component')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (item: GetEmployeeOtherSalaryComponentType) => {
    setFormData({
      employeeId: item.employeeId,
      otherSalaryComponentId: item.otherSalaryComponentId,
      salaryMonth: item.salaryMonth,
      salaryYear: item.salaryYear,
      amount: item.amount,
      isAuthorized: item.isAuthorized,
    })
    setEditingId(item.employeeOtherSalaryComponentId!)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  // Build employee display name for combobox
  const employeeItems = useMemo(() => {
    if (!employees?.data) return []
    return employees.data
      .filter((emp: GetEmployeeType) => emp.isActive === 1)
      .map((emp: GetEmployeeType) => ({
        id: emp.employeeId!.toString(),
        name: `${emp.empCode} - ${emp.empFullName} - ${emp.departmentName || ''} - ${emp.designationName || ''}`,
      }))
  }, [employees?.data])

  const otherComponentItems = useMemo(() => {
    if (!otherSalaryComponents?.data) return []
    return otherSalaryComponents.data.map(
      (comp: GetOtherSalaryComponentType) => ({
        id: comp.otherSalaryComponentId!.toString(),
        name: comp.componentName,
        amount: comp.amount,
      })
    )
  }, [otherSalaryComponents?.data])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <BadgeDollarSign className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">
            Employee Other Salary Components
          </h2>
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
            Add Component
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {!salaryComponents || salaryComponents.data === undefined ? (
          <div className="text-center py-8 text-gray-500">
            Loading salary components...
          </div>
        ) : !salaryComponents.data || salaryComponents.data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No salary components found
          </div>
        ) : paginatedGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No records match your search
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {paginatedGroups.map((periodGroup) => (
              <AccordionItem
                key={periodGroup.periodKey}
                value={periodGroup.periodKey}
                className="rounded-lg border border-gray-200 overflow-hidden shadow-sm"
              >
                {/* Parent Accordion: Salary Month/Year */}
                <AccordionTrigger className="bg-amber-200 px-6 py-4 hover:bg-amber-300 hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <Calendar className="h-5 w-5 text-black flex-shrink-0" />
                    <h3 className="text-lg font-semibold text-black">
                      {periodGroup.periodLabel}
                    </h3>
                    <div className="ml-auto flex items-center gap-3 mr-2">
                      <span className="bg-black/10 px-3 py-1 rounded-full text-sm font-medium text-black flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {periodGroup.totalEmployees}{' '}
                        {periodGroup.totalEmployees === 1
                          ? 'employee'
                          : 'employees'}
                      </span>
                      <span className="bg-black/10 px-3 py-1 rounded-full text-sm font-medium text-black">
                        {periodGroup.totalRecords}{' '}
                        {periodGroup.totalRecords === 1 ? 'record' : 'records'}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          periodGroup.totalAmount >= 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        Net: {periodGroup.totalAmount >= 0 ? '+' : '−'}{' '}
                        {Math.abs(periodGroup.totalAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="bg-white p-4 space-y-3">
                  {/* Child Accordion: Employee Groups */}
                  <Accordion type="multiple" className="space-y-3">
                    {periodGroup.employeeGroups.map((empGroup) => (
                      <AccordionItem
                        key={empGroup.empKey}
                        value={empGroup.empKey}
                        className="rounded-lg border border-gray-100 overflow-hidden"
                      >
                        <AccordionTrigger className="bg-amber-50 px-5 py-3 hover:bg-amber-100 hover:no-underline [&[data-state=open]]:bg-amber-100">
                          <div className="flex items-center gap-3 w-full">
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex items-center gap-2 pb-0.5">
                                <span className="bg-amber-200 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded">
                                  {empGroup.empCode}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {empGroup.employeeName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs py-0.5 text-gray-500">
                                {empGroup.employeeDesignationName} -{' '}
                                {empGroup.employeeDepartmentName}
                              </div>
                            </div>
                            <div className="ml-auto flex items-center gap-3 mr-2">
                              <span className="bg-amber-200/70 px-2.5 py-0.5 rounded-full text-xs font-medium text-amber-900">
                                {empGroup.items.length}{' '}
                                {empGroup.items.length === 1
                                  ? 'component'
                                  : 'components'}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  empGroup.totalAmount >= 0
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                Net: {empGroup.totalAmount >= 0 ? '+' : '−'}{' '}
                                {Math.abs(
                                  empGroup.totalAmount
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="bg-white">
                          <Table>
                            <TableHeader className="bg-amber-50/60">
                              <TableRow>
                                <TableHead className="w-20">Sl No.</TableHead>
                                <TableHead>Component Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Salary Month</TableHead>
                                <TableHead>Salary Year</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                {/* <TableHead className="text-right">
                                  Action
                                </TableHead> */}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {empGroup.items.map((item, index) => {
                                // isSkipped: deduction that is authorized AND not component 6
                                const isSkipped =
                                  item.componentType === 'Deduction' &&
                                  item.isAuthorized === 1 &&
                                  item.isLoneFee !== 1 &&
                                  item.isSkipped === 1

                                return (
                                  <TableRow
                                    key={
                                      item.employeeOtherSalaryComponentId ||
                                      index
                                    }
                                    className="hover:bg-amber-50/50"
                                  >
                                    <TableCell className="font-medium text-gray-600">
                                      {index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {item.componentName}
                                    </TableCell>
                                    <TableCell>
                                      <span
                                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                          item.componentType === 'Allowance'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}
                                      >
                                        {item.componentType === 'Allowance'
                                          ? '+ Allowance'
                                          : '− Deduction'}
                                      </span>
                                    </TableCell>
                                    <TableCell>{item.salaryMonth}</TableCell>
                                    <TableCell>{item.salaryYear}</TableCell>
                                    <TableCell>
                                      <span
                                        className={`font-semibold ${
                                          item.componentType === 'Allowance'
                                            ? 'text-green-600'
                                            : isSkipped
                                              ? 'text-gray-400 line-through'
                                              : 'text-red-600'
                                        }`}
                                      >
                                        {item.componentType === 'Allowance'
                                          ? '+'
                                          : '−'}{' '}
                                        {item.amount.toLocaleString()}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {item.isSkipped ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                          <XCircle className="h-3 w-3" />{' '}
                                          Skipped
                                        </span>
                                      ) : item.isAuthorized ? (
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
                                    {/* <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                          onClick={() => handleEditClick(item)}
                                        >
                                          <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => {
                                            setDeletingId(
                                              item.employeeOtherSalaryComponentId!
                                            )
                                            setIsDeleteDialogOpen(true)
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell> */}
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Pagination */}
      {groupedData.length > 0 && totalPages > 1 && (
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

      {/* Add/Edit Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Salary Component' : 'Add Salary Component'}
        size="sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Employee */}
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

          {/* Other Salary Component */}
          <div className="space-y-2">
            <Label htmlFor="otherSalaryComponent">
              Salary Component <span className="text-red-500">*</span>
            </Label>
            <CustomCombobox
              items={otherComponentItems}
              value={
                formData.otherSalaryComponentId
                  ? otherComponentItems.find(
                      (c) => c.id === formData.otherSalaryComponentId.toString()
                    ) || null
                  : null
              }
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  otherSalaryComponentId: value ? Number(value.id) : 0,
                  amount: value ? value.amount : prev.amount,
                }))
              }}
              placeholder="Select salary component"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Salary Month */}
            <div className="space-y-2">
              <Label htmlFor="salaryMonth">
                Salary Month <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={MONTHS.map((m) => ({ id: m, name: m }))}
                value={
                  formData.salaryMonth
                    ? { id: formData.salaryMonth, name: formData.salaryMonth }
                    : null
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    salaryMonth: value ? value.id : '',
                  }))
                }
                placeholder="Select month"
              />
            </div>

            {/* Salary Year */}
            <div className="space-y-2">
              <Label htmlFor="salaryYear">
                Salary Year <span className="text-red-500">*</span>
              </Label>
              <Input
                id="salaryYear"
                type="number"
                value={formData.salaryYear}
                onChange={(e) =>
                  setFormData((prev) => ({
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

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  amount: Number(e.target.value),
                }))
              }
              min={0}
              step={0.01}
              required
              placeholder="Enter amount"
            />
          </div>

          {/* Is Authorized */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="isAuthorized"
              checked={formData.isAuthorized === 1}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isAuthorized: checked ? 1 : 0,
                }))
              }
              className="data-[state=checked]:bg-amber-500"
            />
            <Label htmlFor="isAuthorized" className="cursor-pointer">
              Authorized
            </Label>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={closePopup}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {addMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : 'Save Component'}
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
            <AlertDialogTitle>Delete Salary Component</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this salary component record? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  deleteMutation.mutate({ id: deletingId })
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

export default EmployeeOtherSalaryComponents
