'use client'

import { useState, useMemo, Fragment } from 'react'
import { flushSync } from 'react-dom'
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
import { File, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useGetLoneReport } from '@/hooks/use-api'
import { formatNumber } from '@/utils/conversions'
import { GetLoneReportType } from '@/utils/type'

// ── helpers ────────────────────────────────────────────────────────────────────

const summarizeInstallments = (
  installments: GetLoneReportType[number]['installments']
) => {
  const total = installments.length
  const paid = installments.filter((i) => i.isSalaryGiven === 1).length
  const totalPaid = installments
    .filter((i) => i.isSalaryGiven === 1)
    .reduce((sum, i) => sum + i.amount, 0)
  const remaining = installments
    .filter((i) => i.isSalaryGiven === 0 && i.isSkipped === 0)
    .reduce((sum, i) => sum + i.amount, 0)
  return { total, paid, totalPaid, remaining }
}

// Add this helper function near your other helpers
const sortInstallmentsByDate = (
  installments: GetLoneReportType[number]['installments']
) => {
  return [...installments].sort((a, b) => {
    // Create date objects for comparison (assuming month names like "January", "February", etc.)
    const monthOrder = [
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

    const yearA = a.salaryYear
    const yearB = b.salaryYear

    if (yearA !== yearB) {
      return yearA - yearB
    }

    const monthA = monthOrder.indexOf(a.salaryMonth)
    const monthB = monthOrder.indexOf(b.salaryMonth)

    return monthA - monthB
  })
}

const InstallmentStatus = ({
  isSalaryGiven,
  isSkipped,
  isAuthorized,
}: {
  isSalaryGiven: number
  isSkipped: number
  isAuthorized: number
}) => {
  if (isSalaryGiven === 1)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
        Paid
      </span>
    )
  if (isSkipped === 1)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
        Skipped
      </span>
    )
  if (isAuthorized === 1)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
        Authorized
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
      Pending
    </span>
  )
}

// ── main component ─────────────────────────────────────────────────────────────

const LoneReport = () => {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  // track which loan rows are expanded: key = employeeLoneId
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const { data: loneReportData }: any = useGetLoneReport(fromDate, toDate)
  console.log('🚀 ~ LoneReport ~ loneReportData:', loneReportData)

  const enrichedLoneData = useMemo((): GetLoneReportType => {
    return loneReportData?.data || []
  }, [loneReportData])

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // For PDF: expand all rows before capture, restore after
  const expandAll = () => {
    setExpandedRows(
      new Set(enrichedLoneData.map((item) => item.lone.employeeLoneId))
    )
  }
  const collapseAll = () => setExpandedRows(new Set())

  // ── Excel export ─────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    type LoanExcelRow = Record<string, string | number>
    const flatData: LoanExcelRow[] = enrichedLoneData.flatMap(
      ({ lone, installments }): LoanExcelRow[] => {
        const { total, paid, totalPaid, remaining } =
          summarizeInstallments(installments)

        const baseRow: LoanExcelRow = {
          'Employee Code': lone.empCode || '',
          'Employee Name': lone.employeeName || '',
          Department: lone.departmentName || '',
          Designation: lone.designationName || '',
          'Loan Name': lone.employeeLoneName,
          'Loan Amount': formatNumber(lone.amount),
          'Per Month': formatNumber(lone.perMonth),
          'Loan Date': lone.loneDate,
          Description: lone.description,
          'Total Installments': total,
          'Paid Installments': paid,
          'Total Paid': formatNumber(totalPaid),
          'Remaining Amount': formatNumber(remaining),
        }

        if (installments.length === 0) return [baseRow]

        return installments.map((inst, idx) => ({
          ...(idx === 0
            ? baseRow
            : Object.fromEntries(Object.keys(baseRow).map((k) => [k, '']))),
          'Inst. Month': inst.salaryMonth,
          'Inst. Year': inst.salaryYear,
          'Inst. Amount': formatNumber(inst.amount),
          Authorized: inst.isAuthorized === 1 ? 'Yes' : 'No',
          'Salary Given': inst.isSalaryGiven === 1 ? 'Yes' : 'No',
          Status:
            inst.isSalaryGiven === 1
              ? 'Paid'
              : inst.isSkipped === 1
                ? 'Skipped'
                : inst.isAuthorized === 1
                  ? 'Authorized'
                  : 'Pending',
        }))
      }
    )

    const worksheet = XLSX.utils.json_to_sheet(flatData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Loan Report')
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })
    saveAs(blob, `loan-report-${fromDate}-to-${toDate}.xlsx`)
  }

  // ── PDF export ───────────────────────────────────────────────────────────────
  const generatePdf = async () => {
    // Expand all rows synchronously so React flushes DOM before html2canvas runs
    flushSync(() => {
      setExpandedRows(
        new Set(enrichedLoneData.map((item) => item.lone.employeeLoneId))
      )
    })
    await new Promise((res) => setTimeout(res, 100))

    const targetRef = document.getElementById('lone-report-content')
    if (!targetRef) return

    const theadRows = targetRef.querySelectorAll('thead tr')
    const originalHeights: string[] = []
    theadRows.forEach((row, i) => {
      const el = row as HTMLElement
      originalHeights[i] = el.style.height
      el.style.height = '48px'
    })

    const theadRef = targetRef.querySelector('thead')
    const tbodyRef = targetRef.querySelector('tbody')
    if (!theadRef || !tbodyRef) return

    const fullCanvas = await html2canvas(targetRef, { scale: 2, useCORS: true })
    const theadCanvas = await html2canvas(theadRef as HTMLElement, {
      scale: 2,
      useCORS: true,
    })

    theadRows.forEach((row, i) => {
      const el = row as HTMLElement
      el.style.height = originalHeights[i]
    })

    const pdf = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const marginTop = 70
    const marginBottom = 40
    const horizontalPadding = 30
    const imgWidth = pageWidth - horizontalPadding * 2
    const scale = imgWidth / fullCanvas.width

    const theadHeightPx = theadCanvas.height
    const theadHeightPt = theadHeightPx * scale
    const usablePageHeight = pageHeight - marginTop - marginBottom

    let sourceY = 0
    let heightLeftPx = fullCanvas.height
    let pageCount = 0

    while (heightLeftPx > 0) {
      if (pageCount === 0) {
        const sliceHeightPx = Math.min(heightLeftPx, usablePageHeight / scale)
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = fullCanvas.width
        tempCanvas.height = sliceHeightPx
        tempCanvas
          .getContext('2d')
          ?.drawImage(
            fullCanvas,
            0,
            sourceY,
            fullCanvas.width,
            sliceHeightPx,
            0,
            0,
            fullCanvas.width,
            sliceHeightPx
          )
        pdf.addImage(
          tempCanvas.toDataURL('image/jpeg'),
          'JPEG',
          horizontalPadding,
          marginTop,
          imgWidth,
          sliceHeightPx * scale
        )
        sourceY += sliceHeightPx
        heightLeftPx -= sliceHeightPx
      } else {
        const availableForBody = usablePageHeight - theadHeightPt
        const sliceHeightPx = Math.min(heightLeftPx, availableForBody / scale)
        pdf.addPage()
        pdf.addImage(
          theadCanvas.toDataURL('image/jpeg'),
          'JPEG',
          horizontalPadding,
          marginTop,
          imgWidth,
          theadHeightPt
        )
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = fullCanvas.width
        tempCanvas.height = sliceHeightPx
        tempCanvas
          .getContext('2d')
          ?.drawImage(
            fullCanvas,
            0,
            sourceY,
            fullCanvas.width,
            sliceHeightPx,
            0,
            0,
            fullCanvas.width,
            sliceHeightPx
          )
        pdf.addImage(
          tempCanvas.toDataURL('image/jpeg'),
          'JPEG',
          horizontalPadding,
          marginTop + theadHeightPt,
          imgWidth,
          sliceHeightPx * scale
        )
        sourceY += sliceHeightPx
        heightLeftPx -= sliceHeightPx
      }
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
      const baseText = `Loan Report — ${fromDate} to ${toDate}  ( Date : `
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

    pdf.save(`loan-report-${fromDate}-to-${toDate}.pdf`)

    // Collapse all rows again after PDF is saved
    collapseAll()
  }

  const hasData = enrichedLoneData.length > 0
  const canSearch = fromDate.length > 0 && toDate.length > 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Loan Report</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToExcel}
            variant="ghost"
            className="flex items-center gap-2 bg-green-100 text-green-900 hover:bg-green-200"
            disabled={!hasData}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={generatePdf}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 print:hidden"
            disabled={!hasData}
          >
            <File className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-end gap-4 print:hidden">
        <div className="space-y-2">
          <Label htmlFor="from-date" className="text-sm font-medium">
            From Date:
          </Label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-10 w-44 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to-date" className="text-sm font-medium">
            To Date:
          </Label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-10 w-44 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      </div>

      {/* Report Content */}
      <div id="lone-report-content" className="space-y-6">
        {!canSearch ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              <p className="text-sm text-blue-600">
                Please select both a from date and a to date to view the loan
                report
              </p>
            </CardContent>
          </Card>
        ) : !hasData ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              No loan records found for {fromDate} to {toDate}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-amber-100 pdf-table-header">
                    <TableRow>
                      <TableHead className="font-bold w-8"></TableHead>
                      <TableHead className="font-bold">Employee Code</TableHead>
                      <TableHead className="font-bold">
                        Employee Details
                      </TableHead>
                      <TableHead className="font-bold">Loan Name</TableHead>
                      <TableHead className="font-bold">Loan Amount</TableHead>
                      <TableHead className="font-bold">Per Month</TableHead>
                      <TableHead className="font-bold">Loan Date</TableHead>
                      <TableHead className="font-bold">Description</TableHead>
                      <TableHead className="font-bold text-center" colSpan={3}>
                        Installment Summary
                      </TableHead>
                    </TableRow>
                    <TableRow className="bg-amber-50">
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead className="font-semibold text-blue-700">
                        Total / Paid
                      </TableHead>
                      <TableHead className="font-semibold text-green-700">
                        Total Paid
                      </TableHead>
                      <TableHead className="font-semibold text-red-700">
                        Remaining
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {enrichedLoneData.map((item) => {
                      const { lone, installments } = item
                      const { total, paid, totalPaid, remaining } =
                        summarizeInstallments(installments)
                      const isOpen = expandedRows.has(lone.employeeLoneId)

                      return (
                        <Fragment key={`lone-${lone.employeeLoneId}`}>
                          {/* ── Main loan row ── */}
                          <TableRow
                            className="cursor-pointer hover:bg-amber-50/40"
                            onClick={() => toggleRow(lone.employeeLoneId)}
                          >
                            <TableCell className="text-gray-400">
                              {installments.length > 0 ? (
                                isOpen ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )
                              ) : null}
                            </TableCell>
                            <TableCell>{lone.empCode || '-'}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-gray-800">
                                  {lone.employeeName || '-'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {lone.departmentName || '-'} ·{' '}
                                  {lone.designationName || '-'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {lone.employeeLoneName}
                            </TableCell>
                            <TableCell>{formatNumber(lone.amount)}</TableCell>
                            <TableCell>{formatNumber(lone.perMonth)}</TableCell>
                            <TableCell>{lone.loneDate}</TableCell>
                            <TableCell className="max-w-[160px] whitespace-pre-wrap text-xs text-gray-500">
                              {lone.description || '-'}
                            </TableCell>
                            <TableCell className="text-blue-700 font-medium text-center">
                              {paid} / {total}
                            </TableCell>
                            <TableCell className="text-green-600 font-medium">
                              {totalPaid > 0 ? formatNumber(totalPaid) : '-'}
                            </TableCell>
                            <TableCell className="text-red-600 font-medium">
                              {remaining > 0 ? formatNumber(remaining) : '-'}
                            </TableCell>
                          </TableRow>

                          {/* ── Accordion: installment rows ── */}
                          {/* Inside the accordion body, when mapping installments */}
                          {isOpen && installments.length > 0 && (
                            <>
                              {/* Installment sub-header */}
                              <TableRow className="bg-gray-100">
                                <TableCell></TableCell>
                                <TableCell colSpan={10} className="py-1">
                                  <div className="grid grid-cols-6 text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">
                                    <span>#</span>
                                    <span>Month</span>
                                    <span>Year</span>
                                    <span className="text-right">Amount</span>
                                    <span className="text-center">
                                      Salary Given
                                    </span>
                                    <span className="text-center">Status</span>
                                  </div>
                                </TableCell>
                              </TableRow>

                              {/* Installment data rows - SORTED */}
                              {sortInstallmentsByDate(installments).map(
                                (inst, idx) => (
                                  <TableRow
                                    key={`inst-${inst.employeeOtherSalaryComponentId}`}
                                    className={
                                      inst.isSalaryGiven === 1
                                        ? 'bg-green-50'
                                        : 'bg-gray-50'
                                    }
                                  >
                                    <TableCell></TableCell>
                                    <TableCell colSpan={10} className="py-1.5">
                                      <div className="grid grid-cols-6 text-sm px-2 items-center">
                                        <span className="text-gray-400 text-xs">
                                          {idx + 1}
                                        </span>
                                        <span className="text-gray-700">
                                          {inst.salaryMonth}
                                        </span>
                                        <span className="text-gray-700">
                                          {inst.salaryYear}
                                        </span>
                                        <span className="text-right font-semibold text-gray-800">
                                          {formatNumber(inst.amount)}
                                        </span>
                                        <span className="text-center">
                                          {inst.isSalaryGiven === 1 ? (
                                            <span className="text-green-600 font-bold">
                                              ✓
                                            </span>
                                          ) : (
                                            <span className="text-gray-300">
                                              —
                                            </span>
                                          )}
                                        </span>
                                        <span className="text-center">
                                          <InstallmentStatus
                                            isSalaryGiven={inst.isSalaryGiven}
                                            isSkipped={inst.isSkipped}
                                            isAuthorized={inst.isAuthorized}
                                          />
                                        </span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              )}

                              {/* Installment footer totals - also use sorted for accurate totals? */}
                              <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                                <TableCell></TableCell>
                                <TableCell colSpan={10} className="py-1.5">
                                  <div className="grid grid-cols-6 text-sm px-2 items-center font-semibold">
                                    <span className="text-gray-500 text-xs col-span-3">
                                      Totals
                                    </span>
                                    <span className="text-right text-gray-800">
                                      {formatNumber(
                                        installments.reduce(
                                          (s, i) => s + i.amount,
                                          0
                                        )
                                      )}
                                    </span>
                                    <span className="text-center text-green-600 text-xs">
                                      {paid} paid
                                    </span>
                                    <span className="text-center text-red-500 text-xs">
                                      {total - paid} unpaid
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            </>
                          )}
                        </Fragment>
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

export default LoneReport
