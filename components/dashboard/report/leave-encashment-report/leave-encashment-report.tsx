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
  useGetEmployeeLeaveEncashments,
  useGetAllEmployees,
} from '@/hooks/use-api'
import { CustomCombobox } from '@/utils/custom-combobox'
import { Label } from '@/components/ui/label'

const LeaveEncashmentReport = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')

  const { data: reportData } = useGetEmployeeLeaveEncashments()
  const { data: employeesData } = useGetAllEmployees()

  const employees = useMemo(() => employeesData?.data || [], [employeesData])

  const allReports = useMemo(() => reportData?.data || [], [reportData])

  // Unique years present in the data, sorted descending
  const yearOptions = useMemo(() => {
    const years = new Set<number>()
    allReports.forEach((r: any) => {
      if (r.year) years.add(r.year)
    })
    return Array.from(years)
      .sort((a, b) => b - a)
      .map((y) => ({ id: y.toString(), name: y.toString() }))
  }, [allReports])

  const filteredReports = useMemo(() => {
    return allReports.filter((r: any) => {
      const matchesEmployee = selectedEmployeeId
        ? r.employeeId?.toString() === selectedEmployeeId
        : true
      const matchesYear = selectedYear
        ? r.year?.toString() === selectedYear
        : true
      return matchesEmployee && matchesYear
    })
  }, [allReports, selectedEmployeeId, selectedYear])

  const formatDate = (date: any) => {
    if (!date) return '-'
    const d = new Date(date)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const exportToExcel = () => {
    const flatData = filteredReports.map((r: any) => ({
      'Employee Details': [
        r.empCode,
        r.empFullName,
        r.empDesignation || '-',
        r.empDepartment || '-',
      ].join(' - '),
      'Leave Type': r.leaveTypeName,
      Year: r.year,
      'Encashed Days': r.encashedDays,
      Amount: r.amount,
      'Processed Date': formatDate(r.processedDate),
    }))

    const worksheet = XLSX.utils.json_to_sheet(flatData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Encashment Report')
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })
    saveAs(blob, `leave-encashment-report.xlsx`)
  }

  const generatePdf = async () => {
    const targetRef = document.getElementById('leave-encashment-content')
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
      pdf.text(`Leave Encashment Report  ( ${dateStr} )`, horizontalPadding, 50)
      pdf.setFont('helvetica', 'normal')
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - horizontalPadding - 60,
        pageHeight - marginBottom + 20
      )
    }

    pdf.save(`leave-encashment-report.pdf`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Leave Encashment Report</h2>
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

      {/* Filters */}
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

        <div className="space-y-2">
          <Label className="text-sm font-medium">Year (Optional):</Label>
          <CustomCombobox
            items={yearOptions}
            value={
              selectedYear
                ? {
                    id: selectedYear,
                    name: selectedYear,
                  }
                : null
            }
            onChange={(value) => setSelectedYear(value ? String(value.id) : '')}
            placeholder="Select year"
          />
        </div>
      </div>

      {/* Report Content */}
      <div id="leave-encashment-content" className="space-y-6">
        {filteredReports.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              No leave encashment data found.
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-blue-100">
                    <TableRow>
                      <TableHead className="font-bold">
                        Employee Details
                      </TableHead>
                      <TableHead className="font-bold">Leave Type</TableHead>
                      <TableHead className="font-bold text-right">
                        Year
                      </TableHead>
                      <TableHead className="font-bold text-right">
                        Encashed Days
                      </TableHead>
                      <TableHead className="font-bold text-right">
                        Amount
                      </TableHead>
                      <TableHead className="font-bold">
                        Processed Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((r: any) => (
                      <TableRow key={r.employeeLeaveEncashmentId}>
                        <TableCell className="font-medium">
                          {[
                            r.empCode,
                            r.empFullName,
                            r.empDesignation || '-',
                            r.empDepartment || '-',
                          ].join(' - ')}
                        </TableCell>
                        <TableCell>{r.leaveTypeName}</TableCell>
                        <TableCell className="text-right">{r.year}</TableCell>
                        <TableCell className="text-right text-orange-600">
                          {r.encashedDays}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {r.amount}
                        </TableCell>
                        <TableCell>{formatDate(r.processedDate)}</TableCell>
                      </TableRow>
                    ))}
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

export default LeaveEncashmentReport
