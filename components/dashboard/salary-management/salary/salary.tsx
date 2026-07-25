'use client'

import React, { useRef } from 'react'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowUpDown,
  Search,
  DollarSign,
  Calendar,
  ChevronDown,
  XCircle,
  CheckCircle,
  Lock,
  Unlock,
  Pencil,
  Send,
  Printer,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateSalaryType,
  GetSalaryType,
  GenerateSalaryType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddSalary,
  useUpdateSalary,
  useGetSalaries,
  useGetAllEmployees,
  useGenerateSalary,
  useMakeSalaryPermanent,
  useGiveSalary,
} from '@/hooks/use-api'
import { useReactToPrint } from 'react-to-print'
import { cn } from '@/lib/utils'
import SalaryPayslip from './salary-paysleep'

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

// `GetSalaryType` (from the schema) is `z.array(...)` — the FULL array type.
// Use this alias for a single row so TS actually knows what `.salary` /
// `.otherSalary` look like.
type SalaryRecord = GetSalaryType[number]

interface SalaryFormData {
  salaryMonth: string
  salaryYear: number
}

const defaultForm = (): SalaryFormData => ({
  salaryMonth: MONTHS[new Date().getMonth()],
  salaryYear: new Date().getFullYear(),
})

// ---- Add-popup (generate-salary) local shapes ----
interface PopupComponent {
  salaryStructureDetailId: number
  salaryComponentId: number
  componentName: string
  componentType: string
  calculationType: string
  amount: number
}

interface PopupRow {
  employeeId: number
  empCode: string
  employeeName: string
  basicSalary: number
  doj: string
  departmentId: number
  designationId: number
  components: PopupComponent[]
}

const computeRowTotals = (row: {
  basicSalary: number
  components: { componentType: string; amount: number }[]
}) => {
  const allowanceTotal = row.components
    .filter((c) => c.componentType === 'Allowance')
    .reduce((sum, c) => sum + (c.amount || 0), 0)

  const deductionTotal = row.components
    .filter((c) => c.componentType === 'Deduction')
    .reduce((sum, c) => sum + (c.amount || 0), 0)

  return {
    allowanceTotal,
    deductionTotal,
    grossSalary: row.basicSalary + allowanceTotal,
    netSalary: row.basicSalary + allowanceTotal - deductionTotal,
  }
}

type OtherSalaryComponent = SalaryRecord['otherSalary'][number]

// ---- Edit-popup local shapes ----
interface EditComponent {
  salaryComponentId: number
  componentName: string
  componentType: string
  amount: number
}

interface EditRow {
  salaryId: number
  employeeId: number
  employeeName: string
  salaryMonth: string
  salaryYear: number
  basicSalary: number
  doj: string
  departmentId: number
  designationId: number
  components: EditComponent[]
}

const Salaries = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: salaries } = useGetSalaries()
  console.log('🚀 ~ Salaries ~ salaries:', salaries)
  const { data: employees } = useGetAllEmployees()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [groupsPerPage] = useState(5)
  const [sortColumn, setSortColumn] = useState<string>('employeeName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)

  // Only one group open at a time, collapsed by default
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null)
  // Only one row's component accordion open at a time (within a group)
  const [expandedSalaryId, setExpandedSalaryId] = useState<number | null>(null)
  // Add-popup accordion (keyed by employeeId)
  const [expandedPopupEmpId, setExpandedPopupEmpId] = useState<number | null>(
    null
  )

  const [form, setForm] = useState<SalaryFormData>(defaultForm())
  const [popupRows, setPopupRows] = useState<PopupRow[]>([])

  const resetForm = useCallback(() => {
    setForm(defaultForm())
    setIsPopupOpen(false)
    setError(null)
    setExpandedPopupEmpId(null)
    setPopupRows([])
  }, [])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddSalary({ onClose: closePopup, reset: resetForm })

  const makePermanentMutation = useMakeSalaryPermanent({
    onClose: () => {},
    reset: () => {},
  })
  const handleMakePermanent = useCallback(
    (salaryId: number) => {
      makePermanentMutation.mutate({ id: salaryId })
    },
    [makePermanentMutation]
  )

  const giveSalaryMutation = useGiveSalary({
    onClose: () => {},
    reset: () => {},
  })
  const handleGiveSalary = useCallback(
    (salaryId: number) => {
      giveSalaryMutation.mutate({ id: salaryId })
    },
    [giveSalaryMutation]
  )

  // ---- Confirmation dialog for "make permanent" / "give salary" ----
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'permanent' | 'give'
    salaryId: number
    employeeName: string
  } | null>(null)

  const closeConfirmDialog = useCallback(() => setConfirmDialog(null), [])

  const handleConfirmAction = useCallback(() => {
    if (!confirmDialog) return
    if (confirmDialog.type === 'permanent') {
      handleMakePermanent(confirmDialog.salaryId)
    } else {
      handleGiveSalary(confirmDialog.salaryId)
    }
    setConfirmDialog(null)
  }, [confirmDialog, handleMakePermanent, handleGiveSalary])

  // Generate salary preview for the selected month/year — seeds popupRows.
  const {
    data: generatedSalaryData,
    isFetching: isGeneratingSalary,
    refetch: refetchGeneratedSalary,
  } = useGenerateSalary(form.salaryMonth, form.salaryYear)

  useEffect(() => {
    if (isPopupOpen) {
      refetchGeneratedSalary()
    }
  }, [isPopupOpen, form.salaryMonth, form.salaryYear, refetchGeneratedSalary])

  useEffect(() => {
    if (!isPopupOpen) return
    const genData = generatedSalaryData?.data
    if (!genData || !Array.isArray(genData)) return

    const empMap = new Map(
      (employees?.data ?? []).map((e: any) => [e.employeeId, e])
    )

    const rows: PopupRow[] = genData.map((g: any) => {
      const emp = empMap.get(g.employeeId)
      return {
        employeeId: g.employeeId,
        empCode: g.empCode,
        employeeName: g.employeeName,
        basicSalary: g.basicSalary,
        doj: emp?.doj ?? '',
        departmentId: emp?.departmentId ?? 0,
        designationId: emp?.designationId ?? 0,
        components: g.components.map((c: any) => ({
          salaryStructureDetailId: c.salaryStructureDetailId,
          salaryComponentId: c.salaryComponentId,
          componentName: c.componentName,
          componentType: c.componentType,
          calculationType: c.calculationType,
          amount: c.amount,
        })),
      }
    })

    setPopupRows(rows)
  }, [generatedSalaryData, employees?.data, isPopupOpen])

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
    return (salaries.data as unknown as SalaryRecord[]).filter((s) =>
      s.salary.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [salaries?.data, searchTerm])

  const groupedSalaries = useMemo(() => {
    const groups = filteredSalaries.reduce(
      (acc: Record<string, SalaryRecord[]>, salary: SalaryRecord) => {
        const key = `${salary.salary.salaryYear}-${salary.salary.salaryMonth}`
        if (!acc[key]) acc[key] = []
        acc[key].push(salary)
        return acc
      },
      {}
    )

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a: SalaryRecord, b: SalaryRecord) => {
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

  const handleComponentAmountChange = useCallback(
    (employeeId: number, salaryComponentId: number, value: number) => {
      setPopupRows((prev) =>
        prev.map((row) =>
          row.employeeId === employeeId
            ? {
                ...row,
                components: row.components.map((c) =>
                  c.salaryComponentId === salaryComponentId
                    ? { ...c, amount: Number.isNaN(value) ? 0 : value }
                    : c
                ),
              }
            : row
        )
      )
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      try {
        if (popupRows.length === 0) {
          setError('No employee salary data to save')
          return
        }

        const payload: CreateSalaryType = popupRows.map((row) => ({
          salaryMonth: form.salaryMonth as any,
          salaryYear: form.salaryYear,
          employeeId: row.employeeId,
          departmentId: row.departmentId,
          designationId: row.designationId,
          basicSalary: row.basicSalary,
          doj: row.doj as any,
          createdBy: userData?.userId || 0,
          components: row.components.map((c) => ({
            salaryStructureDetailId: c.salaryStructureDetailId,
            salaryComponentId: c.salaryComponentId,
            componentName: c.componentName,
            componentType: c.componentType as 'Allowance' | 'Deduction',
            amount: c.amount,
          })),
        }))

        await addMutation.mutateAsync(payload)
      } catch (err) {
        setError('Failed to save salary')
        console.error(err)
      }
    },
    [popupRows, form, addMutation, userData]
  )

  const formatGroupLabel = (key: string) => {
    const [year, month] = key.split('-')
    return `${month} ${year}`
  }

  // ---- Edit popup ----
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false)
  const [editRow, setEditRow] = useState<EditRow | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  const closeEditPopup = useCallback(() => {
    setIsEditPopupOpen(false)
    setEditRow(null)
    setEditError(null)
  }, [])

  const updateMutation = useUpdateSalary({
    onClose: closeEditPopup,
    reset: closeEditPopup,
  })

  const handleOpenEdit = useCallback((salary: SalaryRecord) => {
    const s = salary.salary
    const otherSalary = salary.otherSalary ?? []

    setEditRow({
      salaryId: s.salaryId,
      employeeId: s.employeeId,
      employeeName: s.employeeName,
      salaryMonth: s.salaryMonth,
      salaryYear: s.salaryYear,
      basicSalary: s.basicSalary,
      doj: s.doj,
      departmentId: s.departmentId,
      designationId: s.designationId,
      components: otherSalary.map((c) => ({
        salaryComponentId: c.salaryComponentId,
        componentName: c.componentName,
        componentType: c.componentType,
        amount: c.amount,
      })),
    })
    setEditError(null)
    setIsEditPopupOpen(true)
  }, [])

  const handleEditComponentAmountChange = useCallback(
    (salaryComponentId: number, value: number) => {
      setEditRow((prev) =>
        prev
          ? {
              ...prev,
              components: prev.components.map((c) =>
                c.salaryComponentId === salaryComponentId
                  ? { ...c, amount: Number.isNaN(value) ? 0 : value }
                  : c
              ),
            }
          : prev
      )
    },
    []
  )

  const handleEditSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!editRow) return
      setEditError(null)

      try {
        // Backend matches the record by employeeId + salaryMonth + salaryYear
        // and overwrites it, so we don't need a per-component detail id —
        // salaryComponentId is enough to identify each component.
        const data = {
          salaryMonth: editRow.salaryMonth,
          salaryYear: editRow.salaryYear,
          employeeId: editRow.employeeId,
          departmentId: editRow.departmentId,
          designationId: editRow.designationId,
          basicSalary: editRow.basicSalary,
          doj: editRow.doj,
          updatedBy: userData?.userId || 0,
          components: editRow.components.map((c) => ({
            salaryComponentId: c.salaryComponentId,
            componentType: c.componentType,
            amount: c.amount,
          })),
        }

        await updateMutation.mutateAsync({ data })
      } catch (err) {
        setEditError('Failed to update salary')
        console.error(err)
      }
    },
    [editRow, updateMutation, userData]
  )

  // ---- Payslip print ----
  const contentRef = useRef<HTMLDivElement>(null)
  const reactToPrintFn = useReactToPrint({ contentRef })

  const [selectedSalaryForPrint, setSelectedSalaryForPrint] = useState<{
    employeeName: string
    empCode?: string
    departmentName: string
    designationName: string
    salaryMonth: string
    salaryYear: number
    basicSalary: number
    netSalary: number
    components: OtherSalaryComponent[]
  } | null>(null)

  const handleDownloadPayslip = useCallback(
    (salary: SalaryRecord) => {
      const s = salary.salary
      setSelectedSalaryForPrint({
        employeeName: s.employeeName,
        empCode: (s as any).empCode,
        departmentName: (s as any).departmentName ?? 'Unassigned',
        designationName: (s as any).designationName ?? 'Unassigned',
        salaryMonth: s.salaryMonth,
        salaryYear: s.salaryYear,
        basicSalary: s.basicSalary,
        netSalary: s.netSalary,
        components: salary.otherSalary ?? [],
      })
      setTimeout(() => {
        reactToPrintFn && reactToPrintFn()
      }, 100)
    },
    [reactToPrintFn]
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <DollarSign className="text-blue-600" />
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
            className="bg-blue-500 hover:bg-blue-600 text-black"
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
          paginatedGroups.map(([key, groupSalaries]) => {
            const isGroupExpanded = expandedGroupKey === key
            return (
              <div
                key={key}
                className="rounded-lg border border-gray-200 overflow-hidden shadow-sm"
              >
                {/* Group Header — click to expand/collapse */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroupKey(isGroupExpanded ? null : key)
                  }
                  className="w-full bg-blue-200 px-6 py-4 flex items-center gap-3 text-left"
                >
                  <Calendar className="h-5 w-5 text-black" />
                  <h3 className="text-lg font-semibold text-black">
                    {formatGroupLabel(key)}
                  </h3>
                  <span className="ml-auto bg-black/10 px-3 py-1 rounded-full text-sm font-medium text-black">
                    {groupSalaries.length}{' '}
                    {groupSalaries.length === 1 ? 'employee' : 'employees'}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-black transition-transform duration-200',
                      isGroupExpanded && 'rotate-180'
                    )}
                  />
                </button>

                {/* Salary Table */}
                {isGroupExpanded && (
                  <div className="bg-white">
                    <Table>
                      <TableHeader className="bg-blue-50">
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
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupSalaries.map(
                          (salary: SalaryRecord, index: number) => {
                            const salaryId = salary.salary.salaryId
                            const isDraft = salary.salary.isDraft === true

                            const salaryGiven =
                              salary.salary.isSalaryGiven === true
                            const isExpanded = expandedSalaryId === salaryId

                            const otherSalary: OtherSalaryComponent[] =
                              salary.otherSalary ?? []

                            const allowanceTotal = otherSalary
                              .filter((c) => c.componentType === 'Allowance')
                              .reduce((sum, c) => sum + c.amount, 0)

                            const deductionTotal = otherSalary
                              .filter((c) => c.componentType === 'Deduction')
                              .reduce((sum, c) => sum + c.amount, 0)

                            return (
                              <React.Fragment key={salaryId}>
                                <TableRow
                                  className="hover:bg-blue-50/50 cursor-pointer"
                                  onClick={() =>
                                    setExpandedSalaryId(
                                      isExpanded ? null : salaryId
                                    )
                                  }
                                >
                                  <TableCell className="w-10 pr-0">
                                    {otherSalary.length > 0 && (
                                      <ChevronDown
                                        className={cn(
                                          'h-4 w-4 text-blue-600 transition-transform duration-200',
                                          isExpanded && 'rotate-180'
                                        )}
                                      />
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
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      {isDraft ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full w-fit">
                                          <Lock className="h-3 w-3" /> Draft
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full w-fit">
                                          <CheckCircle className="h-3 w-3" />{' '}
                                          Permanent
                                        </span>
                                      )}
                                      {salaryGiven ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full w-fit">
                                          <CheckCircle className="h-3 w-3" />{' '}
                                          Given
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full w-fit">
                                          <XCircle className="h-3 w-3" /> Not
                                          Given
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div
                                      className="flex justify-end gap-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        title="Mark as permanent"
                                        disabled={isDraft === false}
                                        onClick={() =>
                                          setConfirmDialog({
                                            type: 'permanent',
                                            salaryId,
                                            employeeName:
                                              salary.salary.employeeName,
                                          })
                                        }
                                      >
                                        <Unlock className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                                        title="Edit salary"
                                        disabled={
                                          isDraft === false ||
                                          salaryGiven === true
                                        }
                                        onClick={() => handleOpenEdit(salary)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 disabled:opacity-30"
                                        title="Give salary"
                                        disabled={
                                          salaryGiven ||
                                          giveSalaryMutation.isPending
                                        }
                                        onClick={() =>
                                          setConfirmDialog({
                                            type: 'give',
                                            salaryId,
                                            employeeName:
                                              salary.salary.employeeName,
                                          })
                                        }
                                      >
                                        <Send className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        title="Download payslip"
                                        onClick={() =>
                                          handleDownloadPayslip(salary)
                                        }
                                      >
                                        <Printer className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>

                                {isExpanded && (
                                  <TableRow className="bg-blue-50/40">
                                    <TableCell
                                      colSpan={8}
                                      className="py-0 px-0"
                                    >
                                      <div className="pl-14 pr-6 py-4 border-t border-blue-100">
                                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">
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
                                              <TableHead className="text-xs text-right">
                                                Amount
                                              </TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {otherSalary.map((c, idx) => (
                                              <TableRow
                                                key={c.salaryComponentId}
                                                className="bg-white"
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
                                                <TableCell className="text-right font-medium text-sm">
                                                  <span
                                                    className={
                                                      c.componentType ===
                                                      'Allowance'
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }
                                                  >
                                                    {c.componentType ===
                                                    'Allowance'
                                                      ? '+'
                                                      : '-'}
                                                    {c.amount.toLocaleString()}
                                                  </span>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                        <div className="flex gap-6 mt-3 pt-2 border-t border-blue-100 text-sm">
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
                )}
              </div>
            )
          })
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
        size="sm:max-w-7xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
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

          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Employees ({popupRows.length})
            </Label>

            {isGeneratingSalary ? (
              <div className="text-center py-8 text-gray-500 border rounded-lg">
                Generating salary preview...
              </div>
            ) : popupRows.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border rounded-lg">
                No employee salary data for this month/year
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table className="border">
                  <TableHeader className="bg-blue-50">
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
                    {popupRows.map((row, index) => {
                      const {
                        grossSalary,
                        netSalary,
                        allowanceTotal,
                        deductionTotal,
                      } = computeRowTotals(row)
                      const isExpanded = expandedPopupEmpId === row.employeeId

                      return (
                        <React.Fragment key={row.employeeId}>
                          <TableRow
                            className="hover:bg-blue-50/50 cursor-pointer"
                            onClick={() =>
                              setExpandedPopupEmpId(
                                isExpanded ? null : row.employeeId
                              )
                            }
                          >
                            <TableCell className="w-10 pr-0">
                              {row.components.length > 0 && (
                                <ChevronDown
                                  className={cn(
                                    'h-4 w-4 text-blue-600 transition-transform duration-200',
                                    isExpanded && 'rotate-180'
                                  )}
                                />
                              )}
                            </TableCell>

                            <TableCell className="text-gray-500">
                              {index + 1}
                            </TableCell>

                            <TableCell className="font-medium">
                              {row.employeeName}
                            </TableCell>

                            <TableCell>
                              <Input
                                value={row.basicSalary.toLocaleString()}
                                disabled
                                className="w-32 bg-gray-50"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>

                            <TableCell>
                              <Input
                                value={grossSalary.toLocaleString()}
                                disabled
                                className="w-32 bg-gray-50"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>

                            <TableCell>
                              <Input
                                value={netSalary.toLocaleString()}
                                disabled
                                className="w-32 bg-gray-50 font-semibold text-green-700"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                          </TableRow>

                          {isExpanded && (
                            <TableRow className="bg-blue-50/40">
                              <TableCell colSpan={6} className="py-0 px-0">
                                <div className="pl-12 pr-4 py-3 border-t border-blue-100">
                                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
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
                                        <TableHead className="text-xs text-right">
                                          Amount
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                      {row.components.map((c, idx) => (
                                        <TableRow
                                          key={c.salaryComponentId}
                                          className="bg-white"
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
                                                c.componentType === 'Allowance'
                                                  ? 'bg-green-100 text-green-700'
                                                  : 'bg-red-100 text-red-700'
                                              )}
                                            >
                                              {c.componentType}
                                            </span>
                                          </TableCell>

                                          <TableCell className="text-right">
                                            <Input
                                              type="number"
                                              value={c.amount}
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                              onChange={(e) =>
                                                handleComponentAmountChange(
                                                  row.employeeId,
                                                  c.salaryComponentId,
                                                  Number(e.target.value)
                                                )
                                              }
                                              className="w-28 ml-auto text-right"
                                            />
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>

                                  <div className="flex gap-6 mt-2 pt-2 border-t border-blue-100 text-sm">
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
            )}
          </div>

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
              disabled={addMutation.isPending || popupRows.length === 0}
              className="bg-blue-500 hover:bg-blue-600 text-black"
            >
              {addMutation.isPending ? 'Saving...' : 'Save Salary'}
            </Button>
          </div>
        </form>
      </Popup>

      {/* Edit Popup */}
      <Popup
        isOpen={isEditPopupOpen}
        onClose={closeEditPopup}
        title="Edit Salary"
        size="sm:max-w-3xl"
      >
        {editRow && (
          <form onSubmit={handleEditSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Employee</Label>
                <p className="font-medium">{editRow.employeeName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Month / Year</Label>
                <p className="font-medium">
                  {editRow.salaryMonth} {editRow.salaryYear}
                </p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table className="border">
                <TableHeader>
                  <TableRow className="bg-white">
                    <TableHead className="text-xs w-20">Sl No.</TableHead>
                    <TableHead className="text-xs">Component</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editRow.components.map((c, idx) => (
                    <TableRow key={c.salaryComponentId} className="bg-white">
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
                            c.componentType === 'Allowance'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {c.componentType}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={c.amount}
                          onChange={(e) =>
                            handleEditComponentAmountChange(
                              c.salaryComponentId,
                              Number(e.target.value)
                            )
                          }
                          className="w-28 ml-auto text-right"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {(() => {
              const { grossSalary, netSalary, allowanceTotal, deductionTotal } =
                computeRowTotals(editRow)
              return (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">
                      Basic Salary
                    </Label>
                    <Input
                      value={editRow.basicSalary.toLocaleString()}
                      disabled
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">
                      Gross Salary
                    </Label>
                    <Input value={grossSalary.toLocaleString()} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Net Salary</Label>
                    <Input
                      value={netSalary.toLocaleString()}
                      disabled
                      className="font-semibold text-green-700"
                    />
                  </div>
                  <div className="col-span-3 flex gap-6 text-sm">
                    <span className="text-green-700 font-medium">
                      Total Allowances: +{allowanceTotal.toLocaleString()}
                    </span>
                    <span className="text-red-600 font-medium">
                      Total Deductions: -{deductionTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })()}

            {editError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {editError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeEditPopup}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600 text-black"
              >
                {updateMutation.isPending ? 'Saving...' : 'Update Salary'}
              </Button>
            </div>
          </form>
        )}
      </Popup>

      {/* Print Reference */}
      <div style={{ display: 'none' }}>
        <div ref={contentRef}>
          {selectedSalaryForPrint && (
            <SalaryPayslip
              employeeName={selectedSalaryForPrint.employeeName}
              empCode={selectedSalaryForPrint.empCode}
              departmentName={selectedSalaryForPrint.departmentName}
              designationName={selectedSalaryForPrint.designationName}
              salaryMonth={selectedSalaryForPrint.salaryMonth}
              salaryYear={selectedSalaryForPrint.salaryYear}
              basicSalary={selectedSalaryForPrint.basicSalary}
              netSalary={selectedSalaryForPrint.netSalary}
              components={selectedSalaryForPrint.components}
            />
          )}
        </div>
      </div>

      {/* Confirm dialog: make permanent / give salary */}
      <AlertDialog
        open={!!confirmDialog}
        onOpenChange={(open) => !open && closeConfirmDialog()}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.type === 'permanent'
                ? 'Make salary permanent?'
                : 'Give salary?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.type === 'permanent'
                ? `This will lock ${confirmDialog?.employeeName}'s salary as permanent. It can no longer be edited after this.`
                : `This will mark ${confirmDialog?.employeeName}'s salary as given. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Salaries
