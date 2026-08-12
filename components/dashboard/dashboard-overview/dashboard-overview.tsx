'use client'

import {
  DollarSign,
  CreditCard,
  Smartphone,
  User,
  CalendarOff,
  UserX,
  TrendingUp,
  Bell,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isUserLoadingAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom, useAtomValue } from 'jotai'
import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useState } from 'react'
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
  useGetAllEmployees,
  useGetEmployeeLeaveSummary,
  useGetEmployeeAttendanceSummary,
  useGetEmployeeLoneSummary,
  useGetEmployeeSalaryStatus,
  useGetNotice,
} from '@/hooks/use-api'

const DashboardOverview = () => {
  useInitializeUser()
  useInitializeUser()
  const isLoading = useAtomValue(isUserLoadingAtom)

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'leaves' | 'absent' | 'loans' | null
    title: string
  }>({
    isOpen: false,
    type: null,
    title: '',
  })

  const [expandedLeaveRows, setExpandedLeaveRows] = useState<Set<number>>(
    new Set()
  )

  const { data: employees } = useGetAllEmployees()
  const { data: leaveSummary } = useGetEmployeeLeaveSummary()
  const { data: attendanceSummary } = useGetEmployeeAttendanceSummary()
  const { data: loneSummary } = useGetEmployeeLoneSummary()
  const { data: salaryStatus } = useGetEmployeeSalaryStatus()
  const { data: notice } = useGetNotice()

  // useEffect(() => {
  //   const checkUserData = () => {
  //     const storedUserData = localStorage.getItem('currentUser')
  //     const storedToken = localStorage.getItem('authToken')

  //     if (!storedUserData || !storedToken) {
  //       router.push('/')
  //       return
  //     }
  //     setIsLoading(false)
  //   }

  //   checkUserData()
  // }, [userData, router])

  const openModal = (type: 'leaves' | 'absent' | 'loans') => {
    const titles = {
      leaves: 'Employee Leave Summary',
      absent: 'Employee Attendance Summary',
      loans: 'Employee Loan Summary',
    }
    setModalState({ isOpen: true, type, title: titles[type] })
  }

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, title: '' })
    setExpandedLeaveRows(new Set())
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

  // salaryStatus.data is assumed to be an array of monthly records:
  // { month, year?, grossPayroll, netPayroll, totalPaidAmount, totalUnpaidAmount }
  // Adjust the field names below if your API response differs.
  const salaryChartData = salaryStatus?.data
    ? salaryStatus.data.map((month: any) => ({
        month: month.monthName ?? month.month,
        year: month.year,
        grossPayroll: month.grossPayroll,
        netPayroll: month.netPayroll,
        totalPaidAmount: month.totalPaidAmount,
        totalUnpaidAmount: month.totalUnpaidAmount,
      }))
    : []

  const metrics = [
    {
      title: 'Total Employees',
      value: employees?.data?.length || 0,
      icon: User,
      color: 'bg-blue-500',
      onClick: undefined,
    },
    {
      title: 'Total Leaves Taken',
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
  ]

  const renderModalContent = () => {
    switch (modalState.type) {
      case 'leaves':
        return (
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
                {leaveSummary?.data && leaveSummary.data.length > 0 ? (
                  leaveSummary.data.map((emp: any, index: number) => {
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
                                        {leave.takenLeaves}/{leave.totalLeaves}{' '}
                                        ({leave.remainingLeaves} remaining)
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
        )

      case 'absent':
        return (
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
                  <TableHead className="text-right">Early Out (mins)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceSummary?.data &&
                attendanceSummary.data.length > 0 ? (
                  attendanceSummary.data.map((emp: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {emp.employeeDetails.empCode}
                      </TableCell>
                      <TableCell>{emp.employeeDetails.empFullName}</TableCell>
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
                  ))
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
        )

      case 'loans':
        return (
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
                {loneSummary?.data && loneSummary.data.length > 0 ? (
                  loneSummary.data.map((emp: any, index: number) => (
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
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {metric.value.toLocaleString('en-US')}
                  </p>
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
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Salary Overview (Net Payroll)
            </CardTitle>
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
