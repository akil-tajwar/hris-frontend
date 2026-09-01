'use client'

import {
  CreditCard,
  User,
  CalendarOff,
  UserX,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  isUserLoadingAtom,
  useInitializeUser,
  userDataAtom,
} from '@/utils/user'
import { useAtom, useAtomValue } from 'jotai'
import { Fragment, useState } from 'react'
import { Popup } from '@/utils/popup'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  useGetEmployeeLeaveSummary,
  useGetEmployeeAttendanceSummary,
  useGetEmployeeLoneSummary,
  useGetEmployeeSalaryStatus,
  useGetEmployeeLateAndEarlyOutSummary,
  useGetEmployeeHeadCountSummary,
  useGetNotice,
  useGetCompanies,
  useGetDepartments,
} from '@/hooks/use-api'
import { CustomCombobox } from '@/utils/custom-combobox'

type DateFilter = 'month' | 'year'

type ModalType =
  | 'leaves'
  | 'absent'
  | 'loans'
  | 'lateEarlyOut'
  | 'headcount'
  | null

type ModalFilters = {
  departmentId: string
  dateFilter: DateFilter
}

const DEFAULT_MODAL_FILTERS: ModalFilters = {
  departmentId: '',
  dateFilter: 'year',
}

const changeTypeColor: Record<string, string> = {
  INCREASE: 'text-green-600',
  DECREASE: 'text-red-600',
  NO_CHANGE: 'text-gray-500',
  INITIAL: 'text-gray-500',
}

const DashboardOverview = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const isLoading = useAtomValue(isUserLoadingAtom)

  const userId = userData?.userId
  const roleId = userData?.roleId
  const isRoleFour = roleId === 4

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: ModalType
    title: string
  }>({
    isOpen: false,
    type: null,
    title: '',
  })

  const [expandedLeaveRows, setExpandedLeaveRows] = useState<Set<number>>(
    new Set()
  )
  const [expandedLateEarlyRows, setExpandedLateEarlyRows] = useState<
    Set<number>
  >(new Set())

  // Company selection (applies to every card + every popup + salary graph)
  const [formData, setFormData] = useState<{ companyId: string }>({
    companyId: '',
  })

  // Filters used inside whichever popup is currently open
  const [modalFilters, setModalFilters] = useState<ModalFilters>(
    DEFAULT_MODAL_FILTERS
  )

  // Filters used directly on the salary graph card (no popup for salary)
  const [salaryFilters, setSalaryFilters] = useState<ModalFilters>(
    DEFAULT_MODAL_FILTERS
  )

  const { data: notice } = useGetNotice()
  const { data: companies } = useGetCompanies()
  const { data: departments } = useGetDepartments()

  const companyIdNum = formData.companyId
    ? Number(formData.companyId)
    : undefined
  const modalDepartmentIdNum = modalFilters.departmentId
    ? Number(modalFilters.departmentId)
    : undefined
  const salaryDepartmentIdNum = salaryFilters.departmentId
    ? Number(salaryFilters.departmentId)
    : undefined

  // ---- Card-level data (company only, all departments) ----
  const { data: leaveSummary } = useGetEmployeeLeaveSummary(
    companyIdNum,
    undefined,
    isRoleFour ? userId : undefined
  )
  const { data: attendanceSummary } = useGetEmployeeAttendanceSummary(
    companyIdNum,
    undefined,
    isRoleFour ? userId : undefined
  )
  const { data: loneSummary } = useGetEmployeeLoneSummary(
    companyIdNum,
    undefined,
    isRoleFour ? userId : undefined
  )
  const { data: lateEarlyOutSummary } = useGetEmployeeLateAndEarlyOutSummary(
    companyIdNum,
    undefined,
    isRoleFour ? userId : undefined
  )
  const { data: headCountSummary } = useGetEmployeeHeadCountSummary(
    companyIdNum,
    undefined,
    isRoleFour ? userId : undefined
  )

  // ---- Salary graph data (company + its own department filter) ----
  const { data: salaryStatus } = useGetEmployeeSalaryStatus(
    companyIdNum,
    salaryDepartmentIdNum,
    isRoleFour ? userId : undefined
  )

  // ---- Popup-level data (company + modal department filter) ----
  const { data: leaveSummaryModal } = useGetEmployeeLeaveSummary(
    companyIdNum,
    modalDepartmentIdNum,
    isRoleFour ? userId : undefined
  )
  const { data: attendanceSummaryModal } = useGetEmployeeAttendanceSummary(
    companyIdNum,
    modalDepartmentIdNum,
    isRoleFour ? userId : undefined
  )
  const { data: loneSummaryModal } = useGetEmployeeLoneSummary(
    companyIdNum,
    modalDepartmentIdNum,
    isRoleFour ? userId : undefined
  )
  const { data: lateEarlyOutSummaryModal } =
    useGetEmployeeLateAndEarlyOutSummary(
      companyIdNum,
      modalDepartmentIdNum,
      isRoleFour ? userId : undefined
    )
  const { data: headCountSummaryModal } = useGetEmployeeHeadCountSummary(
    companyIdNum,
    modalDepartmentIdNum,
    isRoleFour ? userId : undefined
  )

  const departmentItems = (departments?.data ?? [])
    .filter((d: any) => d?.departmentId && d?.departmentName)
    .map((d: any) => ({
      id: String(d.departmentId),
      name: d.departmentName,
    }))

  // The API always returns a full year of data; "this month" is applied
  // client-side using each record's createdAt field.
  const isThisMonth = (dateStr?: string) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const now = new Date()
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    )
  }

  const applyMonthFilter = (data: any[] | null | undefined) => {
    const rows = data ?? []
    return modalFilters.dateFilter === 'month'
      ? rows.filter((row: any) => isThisMonth(row.createdAt))
      : rows
  }

  const leaveSummaryModalData = applyMonthFilter(leaveSummaryModal?.data)
  const attendanceSummaryModalData = applyMonthFilter(
    attendanceSummaryModal?.data
  )
  const loneSummaryModalData = applyMonthFilter(loneSummaryModal?.data)
  const lateEarlyOutSummaryModalData = applyMonthFilter(
    lateEarlyOutSummaryModal?.data
  )
  // Headcount rows are one-per-month already (no createdAt) — "this month"
  // just means the most recent entry in the series.
  const headCountSummaryModalData =
    modalFilters.dateFilter === 'month'
      ? (headCountSummaryModal?.data ?? []).slice(-1)
      : (headCountSummaryModal?.data ?? [])

  const handleSelectChange = (field: 'companyId', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const openModal = (type: Exclude<ModalType, null>) => {
    const titles: Record<Exclude<ModalType, null>, string> = {
      leaves: 'Employee Leave Summary',
      absent: 'Employee Attendance Summary',
      loans: 'Employee Loan Summary',
      lateEarlyOut: 'Late And Early Out Trend',
      headcount: 'Head Count Trend',
    }
    setModalFilters(DEFAULT_MODAL_FILTERS)
    setModalState({ isOpen: true, type, title: titles[type] })
  }

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, title: '' })
    setExpandedLeaveRows(new Set())
    setExpandedLateEarlyRows(new Set())
    setModalFilters(DEFAULT_MODAL_FILTERS)
  }

  const toggleLeaveRow = (index: number) => {
    setExpandedLeaveRows((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleLateEarlyRow = (index: number) => {
    setExpandedLateEarlyRows((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // Compute totals
  const totalLeaves =
    leaveSummary?.data?.reduce(
      (sum: number, emp: any) =>
        sum + (emp.employeeDetails?.totalLeavesTaken ?? 0),
      0
    ) ?? 0

  const totalAbsent =
    attendanceSummary?.data?.reduce(
      (sum: number, emp: any) => sum + (emp.employeeDetails?.totalAbsent ?? 0),
      0
    ) ?? 0

  const totalLoanRemaining =
    loneSummary?.data?.reduce(
      (sum: number, emp: any) => sum + (emp.totalRemaining ?? 0),
      0
    ) ?? 0

  const totalLateMinutes =
    lateEarlyOutSummary?.data?.reduce(
      (sum: number, emp: any) =>
        sum + (emp.employeeDetails?.totalLateInMinutes ?? 0),
      0
    ) ?? 0

  const totalEarlyOutMinutes =
    lateEarlyOutSummary?.data?.reduce(
      (sum: number, emp: any) =>
        sum + (emp.employeeDetails?.totalEarlyOutMinutes ?? 0),
      0
    ) ?? 0

  // Head count: current month is assumed to be the last entry in the series
  const headCountData = headCountSummary?.data ?? []
  const currentHeadCount =
    headCountData.length > 0 ? headCountData[headCountData.length - 1] : null

  const salaryChartDataAll = salaryStatus?.data
    ? salaryStatus.data.map((month: any) => ({
        month: month.monthName ?? month.month,
        year: month.year,
        grossPayroll: month.grossPayroll,
        netPayroll: month.netPayroll,
        totalPaidAmount: month.totalPaidAmount,
        totalUnpaidAmount: month.totalUnpaidAmount,
      }))
    : []

  // Salary rows are one-per-month already (no createdAt) — "this month"
  // just means the most recent entry in the series.
  const salaryChartData =
    salaryFilters.dateFilter === 'month'
      ? salaryChartDataAll.slice(-1)
      : salaryChartDataAll

  type MetricItem = {
    title: string
    icon: any
    color: string
    onClick?: () => void
    clickable?: boolean
    value?: number
    values?: { label: string; value: number }[]
    changeIndicator?: {
      percentageChange: number | null
      changeType: string
    } | null
  }

  const metrics: MetricItem[] = [
    ...(isRoleFour
      ? []
      : [
          {
            title: 'Head Count',
            value: currentHeadCount?.employeeCount ?? 0,
            icon: User,
            color: 'bg-blue-500',
            onClick: () => openModal('headcount'),
            clickable: true,
            changeIndicator: currentHeadCount
              ? {
                  percentageChange: currentHeadCount.percentageChange,
                  changeType: currentHeadCount.changeType,
                }
              : null,
          },
        ]),
    {
      title: 'Leave Trend',
      value: totalLeaves,
      icon: CalendarOff,
      color: 'bg-blue-500',
      onClick: () => openModal('leaves'),
      clickable: true,
    },
    {
      title: 'Total Absent',
      value: totalAbsent,
      icon: UserX,
      color: 'bg-red-500',
      onClick: () => openModal('absent'),
      clickable: true,
    },
    {
      title: 'Total Loan Remaining',
      value: totalLoanRemaining,
      icon: CreditCard,
      color: 'bg-orange-500',
      onClick: () => openModal('loans'),
      clickable: true,
    },
    {
      title: 'Late And Early Out Trend',
      values: [
        { label: 'Late', value: totalLateMinutes },
        { label: 'Early Out', value: totalEarlyOutMinutes },
      ],
      icon: Clock,
      color: 'bg-purple-500',
      onClick: () => openModal('lateEarlyOut'),
      clickable: true,
    },
  ]

  const ModalFilterBar = () => (
    <div className="flex flex-wrap items-center gap-3 pb-4">
      <div className="min-w-[200px]">
        <CustomCombobox
          items={departmentItems}
          value={
            modalFilters.departmentId
              ? {
                  id: modalFilters.departmentId,
                  name:
                    departmentItems.find(
                      (d) => d.id === modalFilters.departmentId
                    )?.name || '',
                }
              : null
          }
          onChange={(value) => {
            setExpandedLeaveRows(new Set())
            setExpandedLateEarlyRows(new Set())
            setModalFilters((prev) => ({
              ...prev,
              departmentId: value ? String(value.id) : '',
            }))
          }}
          placeholder="All departments"
        />
      </div>
      <Select
        value={modalFilters.dateFilter}
        onValueChange={(value: DateFilter) => {
          setExpandedLeaveRows(new Set())
          setExpandedLateEarlyRows(new Set())
          setModalFilters((prev) => ({ ...prev, dateFilter: value }))
        }}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  const renderModalContent = () => {
    switch (modalState.type) {
      case 'leaves':
        return (
          <div>
            <ModalFilterBar />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Emp Code</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">
                      Total Leaves Taken
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveSummaryModalData.length > 0 ? (
                    leaveSummaryModalData.map((emp: any, index: number) => {
                      const isExpanded = expandedLeaveRows.has(index)
                      return (
                        <Fragment key={index}>
                          <TableRow
                            onClick={() => toggleLeaveRow(index)}
                            className="cursor-pointer hover:bg-gray-50"
                          >
                            <TableCell>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {emp.employeeDetails.empCode}
                            </TableCell>
                            <TableCell>
                              {emp.employeeDetails.empFullName}
                            </TableCell>
                            <TableCell>
                              {emp.employeeDetails.designationName}
                            </TableCell>
                            <TableCell>
                              {emp.employeeDetails.departmentName}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {emp.employeeDetails.totalLeavesTaken}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                              <TableCell colSpan={6} className="p-0">
                                <div className="px-6 py-3 space-y-2">
                                  {emp.leaveDetails.map(
                                    (leave: any, i: number) => (
                                      <div
                                        key={i}
                                        className="flex justify-between gap-4 ml-10 text-sm text-gray-600 border-b pb-2 last:border-b-0"
                                      >
                                        <span className="font-medium text-gray-700">
                                          {leave.leaveTypeName}
                                        </span>
                                        <span>
                                          {leave.takenLeaves}/
                                          {leave.totalLeaves} (
                                          {leave.remainingLeaves} remaining)
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-gray-500"
                      >
                        No leave data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      case 'absent':
        return (
          <div>
            <ModalFilterBar />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emp Code</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Total Absent</TableHead>
                    <TableHead className="text-right">Late (mins)</TableHead>
                    <TableHead className="text-right">
                      Early Out (mins)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceSummaryModalData.length > 0 ? (
                    attendanceSummaryModalData.map(
                      (emp: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {emp.employeeDetails.empCode}
                          </TableCell>
                          <TableCell>
                            {emp.employeeDetails.empFullName}
                          </TableCell>
                          <TableCell>
                            {emp.employeeDetails.designationName}
                          </TableCell>
                          <TableCell>
                            {emp.employeeDetails.departmentName}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            {emp.employeeDetails.totalAbsent}
                          </TableCell>
                          <TableCell className="text-right">
                            {emp.employeeDetails.totalLateInMinutes}
                          </TableCell>
                          <TableCell className="text-right">
                            {emp.employeeDetails.totalEarlyOutMinutes}
                          </TableCell>
                        </TableRow>
                      )
                    )
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-6 text-gray-500"
                      >
                        No attendance data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      case 'loans':
        return (
          <div>
            <ModalFilterBar />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emp Code</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Total Loan</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Installments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loneSummaryModalData.length > 0 ? (
                    loneSummaryModalData.map((emp: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {emp.empCode}
                        </TableCell>
                        <TableCell>{emp.empFullName}</TableCell>
                        <TableCell>{emp.designationName}</TableCell>
                        <TableCell>{emp.departmentName}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {emp.totalLoanAmount.toLocaleString('en-US')}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {emp.totalPaid.toLocaleString('en-US')}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {emp.totalRemaining.toLocaleString('en-US')}
                        </TableCell>
                        <TableCell className="text-right text-xs text-gray-600">
                          {emp.paidInstallments}/{emp.totalInstallments}
                          {emp.pendingInstallments > 0 &&
                            ` (${emp.pendingInstallments} pending)`}
                          {emp.skippedInstallments > 0 &&
                            ` (${emp.skippedInstallments} skipped)`}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-6 text-gray-500"
                      >
                        No loan data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      case 'lateEarlyOut':
        return (
          <div>
            <ModalFilterBar />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Emp Code</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">
                      Late (mins / occurrences)
                    </TableHead>
                    <TableHead className="text-right">
                      Early Out (mins / occurrences)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lateEarlyOutSummaryModalData.length > 0 ? (
                    lateEarlyOutSummaryModalData.map(
                      (emp: any, index: number) => {
                        const isExpanded = expandedLateEarlyRows.has(index)
                        return (
                          <Fragment key={index}>
                            <TableRow
                              onClick={() => toggleLateEarlyRow(index)}
                              className="cursor-pointer hover:bg-gray-50"
                            >
                              <TableCell>
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {emp.employeeDetails.empCode}
                              </TableCell>
                              <TableCell>
                                {emp.employeeDetails.empFullName}
                              </TableCell>
                              <TableCell>
                                {emp.employeeDetails.designationName}
                              </TableCell>
                              <TableCell>
                                {emp.employeeDetails.departmentName}
                              </TableCell>
                              <TableCell className="text-right">
                                {emp.employeeDetails.totalLateInMinutes} /{' '}
                                {emp.employeeDetails.lateInOccurrences}
                              </TableCell>
                              <TableCell className="text-right">
                                {emp.employeeDetails.totalEarlyOutMinutes} /{' '}
                                {emp.employeeDetails.earlyOutOccurrences}
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow className="bg-gray-50 hover:bg-gray-50">
                                <TableCell colSpan={7} className="p-0">
                                  <div className="px-6 py-3 space-y-2">
                                    {emp.attendanceDetails.map(
                                      (att: any, i: number) => (
                                        <div
                                          key={i}
                                          className="flex justify-between gap-4 ml-10 text-sm text-gray-600 border-b pb-2 last:border-b-0"
                                        >
                                          <span className="font-medium text-gray-700">
                                            {new Date(
                                              att.attendanceDate
                                            ).toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                            })}{' '}
                                            ({att.status})
                                          </span>
                                          <span>
                                            Late: {att.lateInMinutes}m, Early
                                            Out: {att.earlyOutMinutes}m
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        )
                      }
                    )
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-6 text-gray-500"
                      >
                        No late/early-out data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      case 'headcount':
        return (
          <div>
            <ModalFilterBar />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Employee Count</TableHead>
                    <TableHead className="text-right">% Change</TableHead>
                    <TableHead>Change Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headCountSummaryModalData.length > 0 ? (
                    headCountSummaryModalData.map((row: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {row.month}
                        </TableCell>
                        <TableCell>{row.year}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {row.employeeCount}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            changeTypeColor[row.changeType] ?? 'text-gray-700'
                          }`}
                        >
                          {row.percentageChange !== null
                            ? `${row.percentageChange > 0 ? '+' : ''}${row.percentageChange}%`
                            : '—'}
                        </TableCell>
                        <TableCell
                          className={
                            changeTypeColor[row.changeType] ?? 'text-gray-700'
                          }
                        >
                          {row.changeType}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-gray-500"
                      >
                        No head count data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div
          className={`${userData?.roleId == 4 ? 'grid grid-cols-1 md:grid-cols-4' : 'grid grid-cols-1 md:grid-cols-5'} gap-4`}
        >
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        {userData?.roleId !== 4 && (
          <div className="space-y-2 min-w-[200px]">
            <CustomCombobox
              items={(companies?.data ?? [])
                .filter((c: any) => c?.companyId && c?.companyName)
                .map((c: any) => ({
                  id: String(c.companyId),
                  name: c.companyName,
                }))}
              value={
                formData.companyId
                  ? {
                      id: formData.companyId,
                      name:
                        companies?.data?.find(
                          (c: any) => String(c.companyId) === formData.companyId
                        )?.companyName || '',
                    }
                  : null
              }
              onChange={(value) =>
                handleSelectChange('companyId', value ? String(value.id) : '')
              }
              placeholder="Select company"
            />
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div
        className={`${userData?.roleId == 4 ? 'grid grid-cols-1 md:grid-cols-4' : 'grid grid-cols-1 md:grid-cols-5'} gap-6`}
      >
        {metrics.map((metric, index) => (
          <Card
            key={index}
            className={`hover:shadow-lg transition-shadow duration-200 ${
              metric.clickable
                ? 'cursor-pointer ring-1 ring-transparent hover:ring-gray-200'
                : ''
            }`}
            onClick={metric.onClick}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {metric.title}
                  </p>

                  {metric.values ? (
                    <div className="space-y-0.5">
                      {metric.values.map((v) => (
                        <p
                          key={v.label}
                          className="text-lg font-bold text-gray-900"
                        >
                          {v.value.toLocaleString('en-US')}{' '}
                          <span className="text-xs font-normal text-gray-500">
                            {v.label}
                          </span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {(metric.value ?? 0).toLocaleString('en-US')}
                    </p>
                  )}

                  {metric.changeIndicator && (
                    <p
                      className={`text-xs font-medium flex items-center gap-1 mt-1 ${
                        changeTypeColor[metric.changeIndicator.changeType] ??
                        'text-gray-500'
                      }`}
                    >
                      {metric.changeIndicator.changeType === 'INCREASE' && (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {metric.changeIndicator.changeType === 'DECREASE' && (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {(metric.changeIndicator.changeType === 'NO_CHANGE' ||
                        metric.changeIndicator.changeType === 'INITIAL') && (
                        <Minus className="h-3 w-3" />
                      )}
                      {metric.changeIndicator.percentageChange !== null
                        ? `${metric.changeIndicator.percentageChange > 0 ? '+' : ''}${metric.changeIndicator.percentageChange}% this month`
                        : 'This month'}
                    </p>
                  )}

                  {metric.clickable && (
                    <p className="text-xs text-blue-500 mt-1">
                      Click to view details →
                    </p>
                  )}
                </div>
                <div className={`${metric.color} p-3 rounded-xl shadow-sm`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Salary Overview Graph + Notice Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200 lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Salary Overview (Net Payroll)
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[180px]">
                  <CustomCombobox
                    items={departmentItems}
                    value={
                      salaryFilters.departmentId
                        ? {
                            id: salaryFilters.departmentId,
                            name:
                              departmentItems.find(
                                (d) => d.id === salaryFilters.departmentId
                              )?.name || '',
                          }
                        : null
                    }
                    onChange={(value) =>
                      setSalaryFilters((prev) => ({
                        ...prev,
                        departmentId: value ? String(value.id) : '',
                      }))
                    }
                    placeholder="All departments"
                  />
                </div>
                <Select
                  value={salaryFilters.dateFilter}
                  onValueChange={(value: DateFilter) =>
                    setSalaryFilters((prev) => ({
                      ...prev,
                      dateFilter: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80">
              {salaryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={salaryChartData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 50 }}
                  >
                    <CartesianGrid
                      strokeDasharray="0"
                      stroke="#e5e7eb"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />

                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                            <p className="font-semibold text-gray-700 mb-2">
                              {d.month}
                              {d.year ? ` ${d.year}` : ''}
                            </p>
                            <div className="flex justify-between gap-6 text-gray-600">
                              <span>Paid</span>
                              <span>
                                {d.totalPaidAmount?.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                            <div className="flex justify-between gap-6 text-gray-600">
                              <span>Unpaid</span>
                              <span>
                                {d.totalUnpaidAmount?.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                            <div className="flex justify-between gap-6 font-bold text-blue-700 border-t border-gray-200 mt-2 pt-2">
                              <span>Gross Payroll</span>
                              <span>
                                {d.grossPayroll?.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                            <div className="flex justify-between gap-6 font-bold text-green-700 pt-1">
                              <span>Net Payroll</span>
                              <span>
                                {d.netPayroll?.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>
                        )
                      }}
                      cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                    />

                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />

                    <Line
                      type="monotone"
                      dataKey="netPayroll"
                      stroke="#059669"
                      name="Net Payroll"
                      strokeWidth={2.5}
                      dot={{ fill: '#059669', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No salary data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notice Section */}
        <Card className="hover:shadow-lg transition-shadow duration-200 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Notices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 overflow-y-auto space-y-3">
              {notice?.data && notice.data.length > 0 ? (
                notice.data.map((item: any) => (
                  <div
                    key={item.noticeId}
                    className="border border-gray-200 bg-slate-100 rounded-md p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {item.title}
                      </p>
                      {item.pdfUrl && (
                        <a
                          href={item.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          View PDF
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(item.noticeDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {item.description && (
                      <p className="text-xs text-gray-600 mt-3">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  No notices available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popup Modal */}
      <Popup
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        size="sm:max-w-5xl"
      >
        <div className="py-4">{renderModalContent()}</div>
      </Popup>
    </div>
  )
}

export default DashboardOverview
