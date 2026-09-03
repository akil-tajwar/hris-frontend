'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import {
  useGetIndividualAttendanceSummaryReport,
  useGetAllEmployees,
} from '@/hooks/use-api'
import {
  GetIndividualAttendanceSummaryReportType,
  GetEmployeeType,
} from '@/utils/type'
import { CustomCombobox } from '@/utils/custom-combobox'

const IndividualAttendanceSummaryReport = () => {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [employee, setEmployee] = useState<{ id: string; name: string } | null>(
    null
  )

  const { data: response } = useGetIndividualAttendanceSummaryReport(
    fromDate,
    toDate
  )
  console.log('🚀 ~ IndividualAttendanceSummaryReport ~ response:', response)
  const { data: employeesData } = useGetAllEmployees()

  const employeeItems = useMemo(
    () =>
      (employeesData?.data ?? []).map((emp: GetEmployeeType) => ({
        id: emp.employeeId!.toString(),
        name: `${emp.empCode} - ${emp.empFullName}`,
      })),
    [employeesData]
  )

  // response → response.data → response.data → array
  const allRecords: GetIndividualAttendanceSummaryReportType[] = useMemo(() => {
    if (!response) return []
    const raw = (response as any)?.data
    return Array.isArray(raw) ? raw : []
  }, [response])

  const records = useMemo(() => {
    if (!employee) return allRecords
    return allRecords.filter((r) => r.employeeId.toString() === employee.id)
  }, [allRecords, employee])

  const grand = useMemo(
    () =>
      records.reduce(
        (acc, r: GetIndividualAttendanceSummaryReportType) => ({
          totalDays: acc.totalDays + r.totalDays,
          present: acc.present + r.present,
          late: acc.late + r.late,
          absent: acc.absent + r.absent,
          halfDay: acc.halfDay + r.halfDay,
          weekend: acc.weekend + r.weekend,
          holiday: acc.holiday + r.holiday,
          onLeave: acc.onLeave + r.onLeave,
        }),
        {
          totalDays: 0,
          present: 0,
          late: 0,
          absent: 0,
          halfDay: 0,
          weekend: 0,
          holiday: 0,
          onLeave: 0,
        }
      ),
    [records]
  )

  const exportToExcel = () => {
    const flatData = records.map(
      (r: GetIndividualAttendanceSummaryReportType) => ({
        'Employee Code': r.empCode,
        'Employee Name': r.empFullName,
        'Total Days': r.totalDays,
        Present: r.present,
        Late: r.late,
        Absent: r.absent,
        'Half Day': r.halfDay,
        Weekend: r.weekend,
        Holiday: r.holiday,
        'On Leave': r.onLeave,
      })
    )
    const ws = XLSX.utils.json_to_sheet(flatData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Summary')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(
      new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `employeewise-attendance-summary-${fromDate}-to-${toDate}.xlsx`
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Employeewise Attendance Summary Report
        </h2>
        <Button
          onClick={exportToExcel}
          variant="ghost"
          className="flex items-center gap-2 bg-green-100 text-green-900 hover:bg-green-200"
          disabled={records.length === 0}
        >
          <FileSpreadsheet className="h-4 w-4" /> Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-4 print:hidden">
        <div className="space-y-2">
          <Label htmlFor="from-date" className="text-sm font-medium">
            From Date:
          </Label>
          <Input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-48"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to-date" className="text-sm font-medium">
            To Date:
          </Label>
          <Input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-48"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Employee:</Label>
          <CustomCombobox
            items={employeeItems}
            value={employee}
            onChange={(value) => setEmployee(value)}
            placeholder="Select employee"
          />
        </div>
      </div>

      {/* Table */}
      {!fromDate || !toDate ? (
        <Card className="shadow-md">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-blue-600">
              Please select both from and to dates to view the summary
            </p>
          </CardContent>
        </Card>
      ) : records.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="p-8 text-center text-gray-500">
            No records found for selected date range
          </CardContent>
        </Card>
      ) : (
        <Table className='shadow-md'>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead colSpan={4} className="font-bold">
                Employee Details
              </TableHead>
              <TableHead className="font-bold text-green-700">
                Present
              </TableHead>
              <TableHead className="font-bold text-yellow-700">Late</TableHead>
              <TableHead className="font-bold text-red-700">Absent</TableHead>
              <TableHead className="font-bold text-orange-700">
                Half Day
              </TableHead>
              <TableHead className="font-bold">Weekend</TableHead>
              <TableHead className="font-bold">Holiday</TableHead>
              <TableHead className="font-bold text-blue-700">
                On Leave
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r: GetIndividualAttendanceSummaryReportType) => (
              <TableRow key={r.employeeId}>
                <TableCell colSpan={4}>
                  {r.empCode}-{r.empFullName}
                </TableCell>
                <TableCell className="text-green-700 font-medium">
                  {r.present}
                </TableCell>
                <TableCell className="text-yellow-700 font-medium">
                  {r.late}
                </TableCell>
                <TableCell className="text-red-700 font-medium">
                  {r.absent}
                </TableCell>
                <TableCell className="text-orange-700 font-medium">
                  {r.halfDay}
                </TableCell>
                <TableCell>{r.weekend}</TableCell>
                <TableCell>{r.holiday}</TableCell>
                <TableCell className="text-blue-700 font-medium">
                  {r.onLeave}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default IndividualAttendanceSummaryReport
