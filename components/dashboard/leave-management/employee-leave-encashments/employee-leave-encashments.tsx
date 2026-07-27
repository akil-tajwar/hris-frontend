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
  Wallet,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popup } from '@/utils/popup'
import type {
  CreateEmployeeLeaveEncashment,
  GetEmployeeLeaveEncashment,
  GetLeaveTypeType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetEmployeeLeaveEncashments,
  useCreateEmployeeLeaveEncashment,
  useGetAllEmployees,
  useGetLeaveTypes,
  useGetLeaveBalanceSummaryReport,
} from '@/hooks/use-api'

// Row shape used only inside the bulk-add table (not persisted as-is)
type BulkEncashmentRow = {
  employeeId: number
  empCode: string
  employeeName: string
  departmentName: string
  designationName: string
  basicSalary: number
  leaveTypeId: number
  leaveTypeName: string
  remainingDays: number
  encashedDays: number
  amount: number
  alreadyEncashed: boolean
}

// Rows grouped by employee for the accordion display in the Add popup
type EmployeeRowGroup = {
  employeeId: number
  empCode: string
  employeeName: string
  departmentName: string
  designationName: string
  rows: BulkEncashmentRow[]
}

const EmployeeLeaveEncashments = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: employeeLeaveEncashments } = useGetEmployeeLeaveEncashments()
  console.log(
    '🚀 ~ EmployeeLeaveEncashments ~ employeeLeaveEncashments:',
    employeeLeaveEncashments
  )
  const { data: employees } = useGetAllEmployees()
  const { data: leaveTypes } = useGetLeaveTypes()
  const { data: leaveBalanceSummary } = useGetLeaveBalanceSummaryReport()
  console.log(
    '🚀 ~ EmployeeLeaveEncashments ~ leaveBalanceSummary:',
    leaveBalanceSummary
  )

  const [error, setError] = useState<string | null>(null)
  const [sortColumn, setSortColumn] =
    useState<keyof GetEmployeeLeaveEncashment>('empFullName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)

  // Only one year group open at a time, collapsed by default (outer list view)
  const [expandedYear, setExpandedYear] = useState<number | null>(null)

  // Table rows used for bulk-add mode
  const [bulkRows, setBulkRows] = useState<BulkEncashmentRow[]>([])
  // Which employee accordion panels are open in the Add popup (open by default)
  const [expandedEmployeeIds, setExpandedEmployeeIds] = useState<Set<number>>(
    new Set()
  )
  // Single processed date applied to the whole batch — its year determines
  // which employee/leaveType combos count as "already encashed"
  const [bulkProcessedDate, setBulkProcessedDate] = useState<Date>(new Date())

  // Set of leave type names for which encashment is allowed. Used only to
  // FILTER which of an employee's own balance entries to show — the
  // leaveTypeId itself is taken from that employee's balance entry (see
  // buildBulkRows below), never from this list. The leave-types table can
  // have more than one row sharing a name (e.g. one per company/division)
  // with different IDs, so this list must never be the source of leaveTypeId
  // — doing so risks sending the wrong leaveTypeId for employees assigned to
  // a different underlying leave-type row than the one this list happened to
  // pick.
  const encashableLeaveTypeNames = useMemo(() => {
    if (!leaveTypes?.data) return new Set<string>()
    const list = Array.isArray(leaveTypes.data)
      ? leaveTypes.data
      : [leaveTypes.data]
    const names = new Set<string>()
    list.forEach((lt: GetLeaveTypeType) => {
      if (lt.encashmentAllowed && lt.name) {
        names.add(lt.name.trim().toLowerCase())
      }
    })
    return names
  }, [leaveTypes?.data])

  // Formats using LOCAL date parts (not toISOString/UTC) — see leave assignment demo for why
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
    setIsPopupOpen(false)
    setBulkRows([])
    setExpandedEmployeeIds(new Set())
    setBulkProcessedDate(new Date())
    setError(null)
  }, [])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useCreateEmployeeLeaveEncashment({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetEmployeeLeaveEncashment) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredEncashments = useMemo(() => {
    if (!employeeLeaveEncashments?.data) return []
    return employeeLeaveEncashments.data.filter(
      (e: GetEmployeeLeaveEncashment) =>
        e.empFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.leaveTypeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.empDepartment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.empDesignation?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employeeLeaveEncashments?.data, searchTerm])

  const sortedEncashments = useMemo(() => {
    return [...filteredEncashments].sort((a, b) => {
      const aValue = (a[sortColumn] ?? '') as any
      const bValue = (b[sortColumn] ?? '') as any
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })
  }, [filteredEncashments, sortColumn, sortDirection])

  // Group (already filtered + sorted) encashments by their `year` field, newest year first
  const groupedByYear = useMemo(() => {
    const map = new Map<number, GetEmployeeLeaveEncashment[]>()
    sortedEncashments.forEach((e) => {
      const year = e.year
      if (!map.has(year)) map.set(year, [])
      map.get(year)!.push(e)
    })
    return Array.from(map.entries()).sort(([yearA], [yearB]) => yearB - yearA)
  }, [sortedEncashments])

  const buildBulkRows = useCallback(
    (processedDate: Date): BulkEncashmentRow[] => {
      if (!employees?.data || encashableLeaveTypeNames.size === 0) return []

      const year = processedDate.getFullYear()
      const rows: BulkEncashmentRow[] = []

      employees.data.forEach((emp: any) => {
        const summary = leaveBalanceSummary?.data?.find(
          (s: any) => s.employeeId === emp.employeeId
        )
        if (!(summary as any)?.leaves || !Array.isArray((summary as any).leaves)) return

        (summary as any).leaves.forEach((leave: any) => {
          const key = leave.leaveTypeName?.trim().toLowerCase()
          if (!key || !encashableLeaveTypeNames.has(key)) return

          const remainingDays = leave.remainingDays ?? 0

          const alreadyEncashed =
            employeeLeaveEncashments?.data?.some(
              (e: GetEmployeeLeaveEncashment) =>
                e.employeeId === emp.employeeId &&
                e.leaveTypeId === leave.leaveTypeId &&
                e.year === year
            ) ?? false

          const basicSalary = emp.basicSalary ?? 0
          const encashedDays = remainingDays
          const amount =
            Math.round((basicSalary / 30) * encashedDays * 100) / 100

          rows.push({
            employeeId: emp.employeeId,
            empCode: emp.empCode,
            employeeName: emp.empFullName,
            departmentName: emp.departmentName,
            designationName: emp.designationName,
            basicSalary,
            leaveTypeId: leave.leaveTypeId,
            leaveTypeName: leave.leaveTypeName,
            remainingDays,
            encashedDays,
            amount,
            alreadyEncashed,
          })
        })
      })

      return rows
    },
    [
      employees?.data,
      encashableLeaveTypeNames,
      leaveBalanceSummary?.data,
      employeeLeaveEncashments?.data,
    ]
  )

  // Rows grouped by employee, for the accordion display
  const bulkRowsByEmployee = useMemo<EmployeeRowGroup[]>(() => {
    const map = new Map<number, EmployeeRowGroup>()
    bulkRows.forEach((row) => {
      if (!map.has(row.employeeId)) {
        map.set(row.employeeId, {
          employeeId: row.employeeId,
          empCode: row.empCode,
          employeeName: row.employeeName,
          departmentName: row.departmentName,
          designationName: row.designationName,
          rows: [],
        })
      }
      map.get(row.employeeId)!.rows.push(row)
    })
    return Array.from(map.values())
  }, [bulkRows])

  const toggleEmployeeExpanded = (employeeId: number) => {
    setExpandedEmployeeIds((prev) => {
      const next = new Set(prev)
      if (next.has(employeeId)) {
        next.delete(employeeId)
      } else {
        next.add(employeeId)
      }
      return next
    })
  }

  // Opens the Add popup, defaulting the processed date to today
  const openAddPopup = useCallback(() => {
    const today = new Date()
    setBulkProcessedDate(today)
    const rows = buildBulkRows(today)
    setBulkRows(rows)
    // Open by default so users see all leave types without an extra click
    setExpandedEmployeeIds(new Set(rows.map((row) => row.employeeId)))
    setError(null)
    setIsPopupOpen(true)
  }, [buildBulkRows])

  // Changing the processed date only re-checks "already encashed" status for the
  // new year — it does not wipe out encashedDays/amount the user has already typed
  const handleProcessedDateChange = (date: Date) => {
    setBulkProcessedDate(date)
    const year = date.getFullYear()
    setBulkRows((prev) =>
      prev.map((row) => ({
        ...row,
        alreadyEncashed:
          employeeLeaveEncashments?.data?.some(
            (e: GetEmployeeLeaveEncashment) =>
              e.employeeId === row.employeeId &&
              e.leaveTypeId === row.leaveTypeId &&
              e.year === year
          ) ?? false,
      }))
    )
  }

  // Encashed Days and Amount are both editable. Changing Encashed Days
  // auto-fills Amount from (basicSalary / 30) * encashedDays, but the user
  // can still override Amount manually afterwards.
  const updateBulkRow = (
    employeeId: number,
    leaveTypeId: number,
    field: 'encashedDays' | 'amount',
    value: number
  ) => {
    setBulkRows((prev) =>
      prev.map((row) => {
        if (row.employeeId !== employeeId || row.leaveTypeId !== leaveTypeId) {
          return row
        }
        if (field === 'encashedDays') {
          const amount = Math.round((row.basicSalary / 30) * value * 100) / 100
          return { ...row, encashedDays: value, amount }
        }
        return { ...row, amount: Math.round(value * 100) / 100 }
      })
    )
  }

  const handleBulkSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      const rowsToInsert = bulkRows.filter(
        (row) => !row.alreadyEncashed && row.encashedDays > 0
      )

      if (rowsToInsert.length === 0) {
        setError(
          'Enter encashed days for at least one employee that has not already been encashed this year'
        )
        return
      }

      const invalidRow = rowsToInsert.find(
        (row) => row.encashedDays > row.remainingDays
      )
      if (invalidRow) {
        setError(
          `${invalidRow.employeeName} has only ${invalidRow.remainingDays} day(s) remaining for ${invalidRow.leaveTypeName}`
        )
        return
      }

      try {
        const year = bulkProcessedDate.getFullYear()
        const payload: CreateEmployeeLeaveEncashment[] = rowsToInsert.map(
          (row) => ({
            employeeId: row.employeeId,
            leaveTypeId: row.leaveTypeId,
            year,
            encashedDays: row.encashedDays,
            amount: row.amount,
            processedDate: bulkProcessedDate,
            createdBy: userData?.userId || 0,
          })
        )
        // NOTE: assumes the create hook/API accepts an array for bulk insert.
        addMutation.mutate(payload)
      } catch (err) {
        setError('Failed to save employee leave encashments')
        console.error(err)
      }
    },
    [bulkRows, bulkProcessedDate, addMutation, userData]
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <Wallet className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Employee Leave Encashments</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search encashments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-blue-400 hover:bg-blue-500 text-black"
            onClick={openAddPopup}
          >
            Add
          </Button>
        </div>
      </div>

      {!employeeLeaveEncashments ||
      employeeLeaveEncashments.data === undefined ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading employee leave encashments...
        </div>
      ) : !employeeLeaveEncashments.data ||
        employeeLeaveEncashments.data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No employee leave encashments found
        </div>
      ) : groupedByYear.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No employee leave encashments match your search
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByYear.map(([year, encashments]) => {
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
                    {encashments.length}{' '}
                    {encashments.length === 1 ? 'record' : 'records'}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-black transition-transform duration-200',
                      isGroupExpanded && 'rotate-180'
                    )}
                  />
                </div>

                {/* Encashment Table */}
                {isGroupExpanded && (
                  <div className="bg-white">
                    <Table>
                      <TableHeader className="bg-blue-100">
                        <TableRow>
                          <TableHead>Sl No.</TableHead>
                          <TableHead
                            onClick={() => handleSort('empFullName')}
                            className="cursor-pointer"
                          >
                            Employee Details{' '}
                            <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort('leaveTypeName')}
                            className="cursor-pointer"
                          >
                            Leave Type{' '}
                            <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort('encashedDays')}
                            className="cursor-pointer"
                          >
                            Encashed Days{' '}
                            <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort('amount')}
                            className="cursor-pointer"
                          >
                            Amount{' '}
                            <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort('processedDate')}
                            className="cursor-pointer"
                          >
                            Processed Date{' '}
                            <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {encashments.map(
                          (
                            encashment: GetEmployeeLeaveEncashment,
                            index: number
                          ) => (
                            <TableRow
                              key={
                                encashment.employeeLeaveEncashmentId ?? index
                              }
                            >
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium">
                                    {encashment.empFullName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {encashment.empCode}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {encashment.empDepartment} ·{' '}
                                    {encashment.empDesignation}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{encashment.leaveTypeName}</TableCell>
                              <TableCell>{encashment.encashedDays}</TableCell>
                              <TableCell>
                                {encashment.amount.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {formatDate(encashment.processedDate)}
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
        title="Add Employee Leave Encashments"
        size="sm:max-w-4xl"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4 py-4">
          {/* Batch processed date — determines the year for the whole batch
              and which employee/leaveType combos are already encashed */}
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="bulkProcessedDate">
              Processed Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bulkProcessedDate"
              name="bulkProcessedDate"
              type="date"
              value={toInputDate(bulkProcessedDate)}
              onChange={(e) =>
                handleProcessedDateChange(
                  e.target.value ? new Date(e.target.value) : new Date()
                )
              }
              required
            />
          </div>

          <div className="max-h-[55vh] overflow-y-auto rounded-md border divide-y">
            {bulkRowsByEmployee.map((emp) => {
              const isExpanded = expandedEmployeeIds.has(emp.employeeId)
              return (
                <div key={emp.employeeId}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleEmployeeExpanded(emp.employeeId)}
                    className="w-full bg-blue-50 px-4 py-3 flex items-center gap-3 text-left cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="font-medium text-sm">
                        {emp.employeeName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {emp.empCode} · {emp.departmentName} ·{' '}
                        {emp.designationName}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-black transition-transform duration-200 shrink-0',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </div>

                  {isExpanded && (
                    <Table>
                      <TableHeader className="bg-blue-100">
                        <TableRow>
                          <TableHead>Leave Type</TableHead>
                          <TableHead>Encashed Days</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emp.rows.map((row) => (
                          <TableRow
                            key={`${row.employeeId}-${row.leaveTypeId}`}
                            className={
                              row.alreadyEncashed ? 'bg-slate-100' : ''
                            }
                          >
                            <TableCell className="text-sm">
                              {row.leaveTypeName}
                              {row.alreadyEncashed && (
                                <span className="block text-xs text-muted-foreground">
                                  Already encashed this year
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                max={row.remainingDays}
                                step="0.5"
                                className="w-24"
                                disabled={row.alreadyEncashed}
                                value={row.encashedDays}
                                onChange={(e) =>
                                  updateBulkRow(
                                    row.employeeId,
                                    row.leaveTypeId,
                                    'encashedDays',
                                    e.target.value ? Number(e.target.value) : 0
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                className="w-28"
                                disabled={row.alreadyEncashed}
                                value={row.amount}
                                onChange={(e) =>
                                  updateBulkRow(
                                    row.employeeId,
                                    row.leaveTypeId,
                                    'amount',
                                    e.target.value ? Number(e.target.value) : 0
                                  )
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )
            })}
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
      </Popup>
    </div>
  )
}

export default EmployeeLeaveEncashments
