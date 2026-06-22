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
import { Badge } from '@/components/ui/badge'
import { File, FileSpreadsheet, ChevronDown, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useGetEmployeeLeaveLedgerReport, useGetAllEmployees } from '@/hooks/use-api'
import { formatDate } from '@/utils/conversions'
import { CustomCombobox } from '@/utils/custom-combobox'

const statusColors: Record<string, string> = {
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Pending: 'bg-yellow-100 text-yellow-800',
}

const LeaveLedgerReport = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  // Track which (employeeId, leaveTypeId) pairs are expanded
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const { data: reportData } = useGetEmployeeLeaveLedgerReport()
  const { data: employeesData } = useGetAllEmployees()

  const employees = useMemo(() => employeesData?.data || [], [employeesData])
  const allReports = useMemo(() => reportData?.data || [], [reportData])

  const filteredReports = useMemo(() => {
    if (!selectedEmployeeId) return allReports
    return allReports.filter(
      (r: any) => r.employeeId?.toString() === selectedEmployeeId
    )
  }, [allReports, selectedEmployeeId])

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const expandAll = () => {
    const keys = new Set<string>()
    filteredReports.forEach((emp: any) => {
      emp.leaveLedgers?.forEach((ledger: any) => {
        keys.add(`${emp.employeeId}-${ledger.leaveTypeId}`)
      })
    })
    setExpandedKeys(keys)
  }

  const collapseAll = () => setExpandedKeys(new Set())

  const formatDateSafe = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      return formatDate(new Date(dateStr))
    } catch {
      return '-'
    }
  }

  const exportToExcel = () => {
    const rows: any[] = []

    filteredReports.forEach((emp: any) => {
      emp.leaveLedgers?.forEach((ledger: any) => {
        // Summary row
        rows.push({
          'Employee Code': emp.empCode,
          'Employee Name': emp.empFullName,
          'Leave Type': ledger.leaveTypeName,
          'Row Type': 'Summary',
          'Allocated Days': ledger.allocatedDays,
          'Used Days': ledger.usedDays,
          'Available Days': ledger.availableDays,
          'Current Balance': ledger.currentBalance,
          Date: '',
          Event: '',
          Status: '',
          'From Date': '',
          'To Date': '',
          Days: '',
          'Balance After': '',
        })

        // History rows
        ledger.history?.forEach((h: any) => {
          rows.push({
            'Employee Code': '',
            'Employee Name': '',
            'Leave Type': '',
            'Row Type': 'History',
            'Allocated Days': '',
            'Used Days': '',
            'Available Days': '',
            'Current Balance': '',
            Date: formatDateSafe(h.date),
            Event: h.event || '-',
            Status: h.status || '-',
            'From Date': formatDateSafe(h.fromDate),
            'To Date': formatDateSafe(h.toDate),
            Days: h.days ?? '-',
            'Balance After': h.balanceAfter ?? '-',
          })
        })
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Ledger')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })
    saveAs(blob, `employee-leave-ledger-report.xlsx`)
  }

  const generatePdf = async () => {
    // Expand all before capturing
    expandAll()
    await new Promise((res) => setTimeout(res, 300))

    const targetRef = document.getElementById('leave-ledger-content')
    if (!targetRef) return

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
      tempCtx?.drawImage(canvas, 0, sourceY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)
      const imgDataSlice = tempCanvas.toDataURL('image/jpeg')
      if (pageCount > 0) pdf.addPage()
      pdf.addImage(imgDataSlice, 'JPEG', horizontalPadding, marginTop, imgWidth, sliceHeightPx * scale)
      heightLeftPx -= sliceHeightPx
      sourceY += sliceHeightPx
      pageCount++
    }

    const today = new Date()
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const totalPages = pdf.internal.pages.length - 1

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('HRIS', horizontalPadding, 35)
      pdf.setFontSize(10)
      pdf.text(`Employee Leave Ledger Report  ( ${dateStr} )`, horizontalPadding, 50)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - horizontalPadding - 60, pageHeight - marginBottom + 20)
    }

    pdf.save(`employee-leave-ledger-report.pdf`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Leave Ledger Report</h2>
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
                        (e: any) => e.employeeId?.toString() === selectedEmployeeId
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

        {filteredReports.length > 0 && (
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        )}
      </div>

      {/* Report Content */}
      <div id="leave-ledger-content" className="space-y-6">
        {filteredReports.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              No leave ledger data found.
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((emp: any) => (
            <Card key={emp.employeeId} className="shadow-md">
              {/* Employee Header */}
              <div className="px-5 py-3 bg-blue-100 border-b flex items-center gap-4">
                <span className="font-bold text-blue-900">{emp.empFullName}</span>
                <span className="text-sm text-blue-600 font-mono">{emp.empCode}</span>
              </div>

              <CardContent className="p-0">
                {emp.leaveLedgers?.map((ledger: any) => {
                  const key = `${emp.employeeId}-${ledger.leaveTypeId}`
                  const isExpanded = expandedKeys.has(key)

                  return (
                    <div key={key} className="border-b last:border-b-0">
                      {/* Leave Type Summary Row */}
                      <div
                        className="flex items-center gap-4 px-5 py-3 bg-blue-50 cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => toggleExpand(key)}
                      >
                        <span className="text-gray-500">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </span>
                        <span className="font-semibold text-sm w-48">
                          {ledger.leaveTypeName}
                        </span>
                        <div className="flex items-center gap-6 text-sm">
                          <span>
                            <span className="text-gray-500">Allocated: </span>
                            <span className="font-medium">{ledger.allocatedDays}</span>
                          </span>
                          <span>
                            <span className="text-gray-500">Used: </span>
                            <span className="font-medium text-orange-600">{ledger.usedDays}</span>
                          </span>
                          <span>
                            <span className="text-gray-500">Available: </span>
                            <span className="font-medium text-green-600">{ledger.availableDays}</span>
                          </span>
                          <span>
                            <span className="text-gray-500">Balance: </span>
                            <span className="font-medium text-blue-600">{ledger.currentBalance}</span>
                          </span>
                        </div>
                      </div>

                      {/* History Table */}
                      {isExpanded && (
                        <div className="overflow-auto">
                          <Table>
                            <TableHeader className="bg-gray-50">
                              <TableRow>
                                <TableHead className="font-bold text-xs">Date</TableHead>
                                <TableHead className="font-bold text-xs">Event</TableHead>
                                <TableHead className="font-bold text-xs">Status</TableHead>
                                <TableHead className="font-bold text-xs">From Date</TableHead>
                                <TableHead className="font-bold text-xs">To Date</TableHead>
                                <TableHead className="font-bold text-xs text-right">Days</TableHead>
                                <TableHead className="font-bold text-xs text-right">Balance After</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ledger.history?.length > 0 ? (
                                ledger.history.map((h: any, idx: number) => (
                                  <TableRow key={h.leaveApplyId ?? idx}>
                                    <TableCell className="text-sm">{formatDateSafe(h.date)}</TableCell>
                                    <TableCell className="text-sm">{h.event || '-'}</TableCell>
                                    <TableCell className="text-sm">
                                      {h.status ? (
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                            statusColors[h.status] ?? 'bg-gray-100 text-gray-700'
                                          }`}
                                        >
                                          {h.status}
                                        </span>
                                      ) : (
                                        '-'
                                      )}
                                    </TableCell>
                                    <TableCell className="text-sm">{formatDateSafe(h.fromDate)}</TableCell>
                                    <TableCell className="text-sm">{formatDateSafe(h.toDate)}</TableCell>
                                    <TableCell className="text-sm text-right">{h.days ?? '-'}</TableCell>
                                    <TableCell className="text-sm text-right font-medium">{h.balanceAfter ?? '-'}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center text-gray-400 text-sm py-4">
                                    No history available
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default LeaveLedgerReport