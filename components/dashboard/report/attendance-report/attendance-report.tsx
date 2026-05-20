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
import { File, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useGetAttendanceReport, useGetAllEmployees } from '@/hooks/use-api'
import { formatDate } from '@/utils/conversions'
import { CustomCombobox } from '@/utils/custom-combobox'
import { cn } from '@/lib/utils'

const AttendanceReport = () => {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  const { data: employees } = useGetAllEmployees()
  const { data: attendanceReports } = useGetAttendanceReport(fromDate, toDate)

  const filteredAttendances = useMemo(() => {
    if (!attendanceReports?.data) return []
    if (!selectedEmployeeId) return attendanceReports.data
    return attendanceReports.data.filter(
      (attendance) => attendance.employeeId?.toString() === selectedEmployeeId
    )
  }, [attendanceReports, selectedEmployeeId])

  const exportToExcel = () => {
    const flatData = filteredAttendances.map((report) => ({
      'Attendance Date': formatDate(new Date(report.attendanceDate)),
      'Employee Details': `${report.empCode} - ${report.employeeName} - ${report.departmentName} - ${report.designationName}`,
      Status: report.isAbsent === 1 ? 'Absent' : 'Present',
      'In Time': report.isAbsent === 1 ? '-' : (report.inTime ?? '-'),
      'Out Time': report.isAbsent === 1 ? '-' : (report.outTime ?? '-'),
      'Late (min)': report.isAbsent === 1 ? '-' : (report.lateInMinutes ?? 0),
      'Early Out (min)':
        report.isAbsent === 1 ? '-' : (report.earlyOutMinutes ?? 0),
    }))

    const worksheet = XLSX.utils.json_to_sheet(flatData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(blob, `attendance-report-${fromDate}-to-${toDate}.xlsx`)
  }

  const generatePdf = async () => {
    const targetRef = document.getElementById('attendance-report-content')
    if (!targetRef) return
    await new Promise((res) => setTimeout(res, 200))

    const canvas = await html2canvas(targetRef, {
      scale: 2,
      useCORS: true,
    })

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const marginTop = 70
    const marginBottom = 40
    const horizontalPadding = 30
    const usablePageHeight = pageHeight - marginTop - marginBottom

    const imgWidth = pageWidth - horizontalPadding * 2
    const scale = imgWidth / canvas.width

    let heightLeftPx = canvas.height
    let sourceY = 0
    let pageCount = 0

    while (heightLeftPx > 0) {
      const sliceHeightPx = Math.min(heightLeftPx, usablePageHeight / scale)

      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')

      tempCanvas.width = canvas.width
      tempCanvas.height = sliceHeightPx

      tempCtx?.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      )

      const imgDataSlice = tempCanvas.toDataURL('image/jpeg')

      if (pageCount > 0) {
        pdf.addPage()
      }

      pdf.addImage(
        imgDataSlice,
        'JPEG',
        horizontalPadding,
        marginTop,
        imgWidth,
        sliceHeightPx * scale
      )

      heightLeftPx -= sliceHeightPx
      sourceY += sliceHeightPx
      pageCount++
    }

    const leftTextMargin = horizontalPadding
    const totalPages = pdf.internal.pages.length - 1

    const today = new Date()
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
    const monthName = today.toLocaleDateString('en-US', { month: 'long' })
    const day = today.getDate()
    const year = today.getFullYear()

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(12)
      pdf.setFont('bold')
      pdf.text('School Management System', leftTextMargin, 35)

      pdf.setFontSize(10)
      const baseText = `Attendance Report from ${fromDate} to ${toDate} ( Date : `
      pdf.setFont('bold')
      pdf.text(baseText, leftTextMargin, 50)
      let currentX = leftTextMargin + pdf.getTextWidth(baseText)
      pdf.text(dayName, currentX, 50)
      currentX += pdf.getTextWidth(dayName)
      pdf.text(', ', currentX, 50)
      currentX += pdf.getTextWidth(', ')
      pdf.text(monthName, currentX, 50)
      currentX += pdf.getTextWidth(monthName)
      pdf.text(` ${day}, ${year} )`, currentX, 50)

      pdf.setFontSize(10)
      pdf.setFont('normal')
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - horizontalPadding - 50,
        pageHeight - marginBottom + 20
      )
    }

    pdf.save(`attendance-report-${fromDate}-to-${toDate}.pdf`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Attendance Report</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToExcel}
            variant="ghost"
            className="flex items-center gap-2 bg-green-100 text-green-900 hover:bg-green-200"
            disabled={filteredAttendances.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={generatePdf}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 print:hidden"
            disabled={filteredAttendances.length === 0}
          >
            <File className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-end gap-4 print:hidden">
        <div className="flex items-center gap-2">
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
        </div>
        <div className="flex items-center gap-2">
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
        </div>
        <div className="flex items-center gap-2">
          <div className="space-y-2 w-96">
            <Label htmlFor="employeeId" className="text-sm font-medium">
              Employee (Optional):
            </Label>
            <CustomCombobox
              items={
                employees?.data?.map((employee) => ({
                  id: employee?.employeeId?.toString() || '0',
                  name:
                    `${employee.empCode} - ${employee.empFullName} - ${employee.departmentName} - ${employee.designationName}` ||
                    'Unnamed employee',
                })) || []
              }
              value={
                selectedEmployeeId
                  ? {
                      id: selectedEmployeeId,
                      name: (() => {
                        const emp = employees?.data?.find(
                          (e) => e.employeeId?.toString() === selectedEmployeeId
                        )
                        return emp
                          ? `${emp.empCode} - ${emp.empFullName} - ${emp.departmentName} - ${emp.designationName}`
                          : ''
                      })(),
                    }
                  : null
              }
              onChange={(value) =>
                setSelectedEmployeeId(value ? String(value.id) : '')
              }
              placeholder="Select employee"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div id="attendance-report-content" className="space-y-6">
        {!fromDate || !toDate ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              <p className="text-sm text-blue-600">
                Please select both from and to dates to view the attendance
                report
              </p>
            </CardContent>
          </Card>
        ) : filteredAttendances.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              No attendance records found for the selected criteria
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-blue-100 pdf-table-header">
                    <TableRow>
                      <TableHead className="font-bold">
                        Attendance Date
                      </TableHead>
                      <TableHead className="font-bold">
                        Employee Details
                      </TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">In Time</TableHead>
                      <TableHead className="font-bold">Out Time</TableHead>
                      <TableHead className="font-bold">Late (min)</TableHead>
                      <TableHead className="font-bold">
                        Early Out (min)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendances.map((report, index) => {
                      const isAbsent = report.isAbsent === 1
                      const hasIssue =
                        !isAbsent &&
                        ((report.lateInMinutes ?? 0) > 0 ||
                          (report.earlyOutMinutes ?? 0) > 0)

                      return (
                        <TableRow
                          key={report.employeeAttendanceId || index}
                          className={cn(
                            isAbsent
                              ? 'bg-red-100 hover:bg-red-100'
                              : hasIssue
                                ? 'bg-red-50 hover:bg-red-50'
                                : ''
                          )}
                        >
                          <TableCell>
                            {formatDate(new Date(report.attendanceDate))}
                          </TableCell>
                          <TableCell>{`${report.empCode} - ${report.employeeName} - ${report.departmentName} - ${report.designationName}`}</TableCell>
                          <TableCell>
                            {isAbsent ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-200 text-red-800">
                                Absent
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                Present
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isAbsent ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              (report.inTime ?? '-')
                            )}
                          </TableCell>
                          <TableCell>
                            {isAbsent ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              (report.outTime ?? '-')
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              !isAbsent &&
                                (report.lateInMinutes ?? 0) > 0 &&
                                'text-red-600 font-medium'
                            )}
                          >
                            {isAbsent ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              (report.lateInMinutes ?? 0)
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              !isAbsent &&
                                (report.earlyOutMinutes ?? 0) > 0 &&
                                'text-red-600 font-medium'
                            )}
                          >
                            {isAbsent ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              (report.earlyOutMinutes ?? 0)
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default AttendanceReport
