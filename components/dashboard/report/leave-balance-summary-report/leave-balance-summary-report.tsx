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
import { File, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  useGetLeaveBalanceSummaryReport,
  useGetAllEmployees,
} from '@/hooks/use-api'
import { CustomCombobox } from '@/utils/custom-combobox'
import { Label } from '@/components/ui/label'

const LeaveBalanceSummaryReport = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  const { data: reportData } = useGetLeaveBalanceSummaryReport()
  const { data: employeesData } = useGetAllEmployees()

  const employees = useMemo(() => employeesData?.data || [], [employeesData])

  const allReports = useMemo(() => reportData?.data || [], [reportData])

  const filteredReports = useMemo(() => {
    if (!selectedEmployeeId) return allReports
    return allReports.filter(
      (r: any) => r.employeeId?.toString() === selectedEmployeeId
    )
  }, [allReports, selectedEmployeeId])

  // Collect all unique leave type names across the filtered data
  const leaveTypeNames = useMemo(() => {
    const names = new Set<string>()
    filteredReports.forEach((emp: any) => {
      emp.leaves?.forEach((l: any) => names.add(l.leaveTypeName))
    })
    return Array.from(names)
  }, [filteredReports])

  const exportToExcel = () => {
    const flatData = filteredReports.flatMap((emp: any) => {
      if (!emp.leaves || emp.leaves.length === 0) {
        return [
          {
            'Employee Code': emp.empCode,
            'Employee Name': emp.empFullName,
            Designation: emp.empDesignation || '-',
            Department: emp.empDepartment || '-',
            'Leave Type': '-',
            'Used Days': '-',
            'Remaining Days': '-',
          },
        ]
      }
      return emp.leaves.map((leave: any, idx: number) => ({
        'Employee Code': idx === 0 ? emp.empCode : '',
        'Employee Name': idx === 0 ? emp.empFullName : '',
        Designation: idx === 0 ? emp.empDesignation || '-' : '',
        Department: idx === 0 ? emp.empDepartment || '-' : '',
        'Leave Type': leave.leaveTypeName,
        'Used Days': leave.usedDays,
        'Remaining Days': leave.remainingDays,
      }))
    })

    const worksheet = XLSX.utils.json_to_sheet(flatData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Balance Summary')
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })
    saveAs(blob, `leave-balance-summary-report.xlsx`)
  }

  const generatePdf = async () => {
    const targetRef = document.getElementById('leave-balance-summary-content')
    if (!targetRef) return
    await new Promise((res) => setTimeout(res, 200))

    const canvas = await html2canvas(targetRef, { scale: 2, useCORS: true })

    const pdf = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' })
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
      if (pageCount > 0) pdf.addPage()
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

    const today = new Date()
    const dateStr = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const totalPages = pdf.internal.pages.length - 1

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('HRIS', horizontalPadding, 35)
      pdf.setFontSize(10)
      pdf.text(
        `Leave Balance Summary Report  ( ${dateStr} )`,
        horizontalPadding,
        50
      )
      pdf.setFont('helvetica', 'normal')
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - horizontalPadding - 60,
        pageHeight - marginBottom + 20
      )
    }

    pdf.save(`leave-balance-summary-report.pdf`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Leave Balance Summary Report</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToExcel}
            variant="ghost"
            className="flex items-center gap-2 bg-green-100 text-green-900 hover:bg-green-200"
            disabled={filteredReports.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={generatePdf}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 print:hidden"
            disabled={filteredReports.length === 0}
          >
            <File className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-end gap-4 print:hidden">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Employee (Optional):</Label>
          <CustomCombobox
            items={
              employees.map((emp: any) => ({
                id: emp.employeeId?.toString() || '0',
                name: emp.empFullName || 'Unnamed',
              })) || []
            }
            value={
              selectedEmployeeId
                ? {
                    id: selectedEmployeeId,
                    name:
                      employees.find(
                        (e: any) =>
                          e.employeeId?.toString() === selectedEmployeeId
                      )?.empFullName || '',
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

      {/* Report Content */}
      <div id="leave-balance-summary-content" className="space-y-6">
        {filteredReports.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              No leave balance data found.
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-blue-100">
                    <TableRow>
                      <TableHead className="font-bold">Emp Code</TableHead>
                      <TableHead className="font-bold">Employee Name</TableHead>
                      <TableHead className="font-bold">Designation</TableHead>
                      <TableHead className="font-bold">Department</TableHead>
                      <TableHead className="font-bold">Leave Type</TableHead>
                      <TableHead className="font-bold text-right">
                        Used Days
                      </TableHead>
                      <TableHead className="font-bold text-right">
                        Remaining Days
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((emp: any) => {
                      const leaves = emp.leaves || []
                      if (leaves.length === 0) {
                        return (
                          <TableRow key={emp.employeeId}>
                            <TableCell>{emp.empCode}</TableCell>
                            <TableCell>{emp.empFullName}</TableCell>
                            <TableCell>{emp.empDesignation || '-'}</TableCell>
                            <TableCell>{emp.empDepartment || '-'}</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell className="text-right">-</TableCell>
                            <TableCell className="text-right">-</TableCell>
                          </TableRow>
                        )
                      }
                      return leaves.map((leave: any, idx: number) => (
                        <TableRow
                          key={`${emp.employeeId}-${leave.leaveTypeName}`}
                          className={
                            idx === 0 ? 'border-t-2 border-gray-300' : ''
                          }
                        >
                          {idx === 0 ? (
                            <>
                              <TableCell
                                rowSpan={leaves.length}
                                className="align-top font-medium"
                              >
                                {emp.empCode}
                              </TableCell>
                              <TableCell
                                rowSpan={leaves.length}
                                className="align-top font-medium"
                              >
                                {emp.empFullName}
                              </TableCell>
                              <TableCell
                                rowSpan={leaves.length}
                                className="align-top"
                              >
                                {emp.empDesignation || '-'}
                              </TableCell>
                              <TableCell
                                rowSpan={leaves.length}
                                className="align-top"
                              >
                                {emp.empDepartment || '-'}
                              </TableCell>
                            </>
                          ) : null}
                          <TableCell>{leave.leaveTypeName}</TableCell>
                          <TableCell className="text-right text-orange-600">
                            {leave.usedDays}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {leave.remainingDays}
                          </TableCell>
                        </TableRow>
                      ))
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

export default LeaveBalanceSummaryReport
