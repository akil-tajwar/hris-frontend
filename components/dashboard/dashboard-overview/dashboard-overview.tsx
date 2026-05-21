'use client'

import {
  DollarSign,
  CreditCard,
  Smartphone,
  User,
  CalendarOff,
  UserX,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  useGetAllEmployees,
  useGetEmployeeLeaveSummary,
  useGetEmployeeAttendanceSummary,
} from '@/hooks/use-api'

const DashboardOverview = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'leaves' | 'absent' | null
    title: string
  }>({
    isOpen: false,
    type: null,
    title: '',
  })

  const { data: employees } = useGetAllEmployees()
  const { data: leaveSummary } = useGetEmployeeLeaveSummary()
  const { data: attendanceSummary } = useGetEmployeeAttendanceSummary()

  useEffect(() => {
    const checkUserData = () => {
      const storedUserData = localStorage.getItem('currentUser')
      const storedToken = localStorage.getItem('authToken')

      if (!storedUserData || !storedToken) {
        router.push('/')
        return
      }
      setIsLoading(false)
    }

    checkUserData()
  }, [userData, token, router])

  const openModal = (type: 'leaves' | 'absent') => {
    const titles = {
      leaves: 'Employee Leave Summary',
      absent: 'Employee Attendance Summary',
    }
    setModalState({ isOpen: true, type, title: titles[type] })
  }

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, title: '' })
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
  ]

  const renderModalContent = () => {
    switch (modalState.type) {
      case 'leaves':
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emp Code</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">
                    Total Leaves Taken
                  </TableHead>
                  <TableHead>Leave Breakdown</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveSummary?.data && leaveSummary.data.length > 0 ? (
                  leaveSummary.data.map((emp: any, index: number) => (
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
                      <TableCell className="text-right font-semibold">
                        {emp.employeeDetails.totalLeavesTaken}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs text-gray-600">
                          {emp.leaveDetails.map((leave: any, i: number) => (
                            <div key={i} className="flex gap-2">
                              <span className="font-medium">
                                {leave.leaveTypeName}:
                              </span>
                              <span>
                                {leave.takenLeaves}/{leave.totalLeaves} (
                                {leave.remainingLeaves} remaining)
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
