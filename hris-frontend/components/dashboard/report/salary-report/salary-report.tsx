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
import { File, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useGetAllEmployees, useGetSalaryReport } from '@/hooks/use-api'
import { formatNumber } from '@/utils/conversions'
import { GetSalaryType } from '@/utils/type'

const MONTHS = [
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

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i)

// Helper: group otherSalary by type for a given employeeId
const groupOtherSalaryForEmployee = (
  otherSalaries: GetSalaryType['otherSalary'],
  employeeId: number
) => {
  const relevant = otherSalaries.filter((o) => o.employeeId === employeeId)

  const allowances = relevant.filter((o) => o.componentType === 'Allowance')
  const deductions = relevant.filter((o) => o.componentType === 'Deduction')

  const formatComponents = (items: typeof relevant): string =>
    items.length > 0
      ? items
          .map((item) => `${item.componentName}: ${formatNumber(item.amount)}`)
          .join(', ')
      : '-'

  const totalAllowance = allowances.reduce((sum, o) => sum + o.amount, 0)
  const totalDeduction = deductions.reduce((sum, o) => sum + o.amount, 0)

  return {
    allowanceText: formatComponents(allowances),
    deductionText: formatComponents(deductions),
    totalAllowance,
    totalDeduction,
  }
}

const SalaryReport = () => {
  const [salaryMonth, setSalaryMonth] = useState('')
  const [salaryYear, setSalaryYear] = useState<number>(0)

  const { data: salaryReports }: any = useGetSalaryReport(
    salaryMonth,
    salaryYear
  )
  console.log('🚀 ~ SalaryReport ~ salaryReports:', salaryReports)
  const { data: employees } = useGetAllEmployees()
  console.log('🚀 ~ SalaryReport ~ employees:', employees)

  // Enrich salary data with allowance/deduction information
  const enrichedSalaryData = useMemo(() => {
    const salaryList = salaryReports?.data?.salary || []
    const otherSalaryList = salaryReports?.data?.otherSalary || []

    return salaryList.map((salary: any) => {
      const { allowanceText, deductionText, totalAllowance, totalDeduction } =
        groupOtherSalaryForEmployee(otherSalaryList, salary.employeeId)

      return {
        ...salary,
        allowanceText,
        deductionText,
        totalAllowance,
        totalDeduction,
      }
    })
  }, [salaryReports])

  const exportToExcel = () => {
    const flatData = enrichedSalaryData.map(
      (row: (typeof enrichedSalaryData)[0]) => ({
        'Employee Code': row.empCode,
        'Employee Name': row.employeeName || '',
        Department: row.departmentName || '',
        Designation: row.designationName || '',
        Month: row.salaryMonth,
        Year: row.salaryYear,
        'Date of Joining': row.doj,
        'Basic Salary': formatNumber(row.basicSalary),
        'Gross Salary': formatNumber(row.grossSalary),
        Allowances: row.allowanceText,
        'Total Allowance': formatNumber(row.totalAllowance),
        Deductions: row.deductionText,
        'Total Deduction': formatNumber(row.totalDeduction),
        'Net Salary': formatNumber(row.netSalary),
      })
    )

    const worksheet = XLSX.utils.json_to_sheet(flatData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Salary Report')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(blob, `salary-report-${salaryMonth}-${salaryYear}.xlsx`)
  }

  const generatePdf = async () => {
    const targetRef = document.getElementById('salary-report-content')
    if (!targetRef) return
    await new Promise((res) => setTimeout(res, 200))

    // Temporarily increase thead row heights for PDF capture
    const theadRows = targetRef.querySelectorAll('thead tr')
    const originalHeights: string[] = []
    theadRows.forEach((row, i) => {
      const el = row as HTMLElement
      originalHeights[i] = el.style.height
      el.style.height = '48px' // force taller rows
    })

    // Capture the thead separately so we can repeat it on every page
    const theadRef = targetRef.querySelector('thead')
    const tbodyRef = targetRef.querySelector('tbody')
    if (!theadRef || !tbodyRef) return

    const fullCanvas = await html2canvas(targetRef, { scale: 2, useCORS: true })
    const theadCanvas = await html2canvas(theadRef as HTMLElement, {
      scale: 2,
      useCORS: true,
    })

    const pdf = new jsPDF({
      orientation: 'p', // portrait
      unit: 'pt',
      format: 'a4',
    })

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

    // First page: draw full canvas from top (includes thead naturally)
    // Subsequent pages: prepend thead, then draw body slice below it

    let sourceY = 0
    let heightLeftPx = fullCanvas.height
    let pageCount = 0

    while (heightLeftPx > 0) {
      if (pageCount === 0) {
        // First page: slice from full canvas normally
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
        // Subsequent pages: reserve space for repeated thead at top
        const availableForBody = usablePageHeight - theadHeightPt
        const sliceHeightPx = Math.min(heightLeftPx, availableForBody / scale)

        pdf.addPage()

        // Draw thead at top
        pdf.addImage(
          theadCanvas.toDataURL('image/jpeg'),
          'JPEG',
          horizontalPadding,
          marginTop,
          imgWidth,
          theadHeightPt
        )

        // Draw body slice below thead
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

    // Add header text and page numbers to every page
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
      const baseText = `Salary Report — ${salaryMonth} ${salaryYear}  ( Date : `
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

    pdf.save(`salary-report-${salaryMonth}-${salaryYear}.pdf`)
  }

  const hasData = enrichedSalaryData.length > 0
  const canSearch = salaryMonth.length > 0 && salaryYear > 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Salary Report</h2>
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
        {/* Month */}
        <div className="space-y-2">
          <Label htmlFor="salary-month" className="text-sm font-medium">
            Month:
          </Label>
          <select
            id="salary-month"
            value={salaryMonth}
            onChange={(e) => setSalaryMonth(e.target.value)}
            className="h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">Select month</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="space-y-2">
          <Label htmlFor="salary-year" className="text-sm font-medium">
            Year:
          </Label>
          <select
            id="salary-year"
            value={salaryYear || ''}
            onChange={(e) => setSalaryYear(Number(e.target.value))}
            className="h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Content */}
      <div id="salary-report-content" className="space-y-6">
        {!canSearch ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              <p className="text-sm text-blue-600">
                Please select both a month and a year to view the salary report
              </p>
            </CardContent>
          </Card>
        ) : !hasData ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              No salary records found for {salaryMonth} {salaryYear}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-amber-100 pdf-table-header">
                    <TableRow>
                      <TableHead className="font-bold">Employee Code</TableHead>
                      <TableHead className="font-bold">Employee Name</TableHead>
                      <TableHead className="font-bold">Department</TableHead>
                      <TableHead className="font-bold">Designation</TableHead>
                      <TableHead className="font-bold">Month</TableHead>
                      <TableHead className="font-bold">Year</TableHead>
                      <TableHead className="font-bold">
                        Date of Joining
                      </TableHead>
                      <TableHead className="font-bold">Basic Salary</TableHead>
                      <TableHead className="font-bold">Gross Salary</TableHead>
                      <TableHead
                        className="font-bold text-center"
                        colSpan={4}
                      >
                        Other Salary
                      </TableHead>
                      <TableHead className="font-bold">Net Salary</TableHead>
                    </TableRow>

                    <TableRow className="bg-amber-50">
                      {/* Empty cells for the non-rowspan columns */}
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      {/* Other Salary sub-headers */}
                      <TableHead className="font-semibold text-green-700">
                        Allowances
                      </TableHead>
                      <TableHead className="font-semibold text-green-700">
                        Total Allowance
                      </TableHead>
                      <TableHead className="font-semibold text-red-700">
                        Deductions
                      </TableHead>
                      <TableHead className="font-semibold text-red-700">
                        Total Deduction
                      </TableHead>
                      {/* Empty for Net Salary */}
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {enrichedSalaryData.map((row: any, index: any) => (
                      <TableRow key={`${row.employeeId}-${index}`}>
                        <TableCell>{row.empCode}</TableCell>
                        <TableCell>{row.employeeName || '-'}</TableCell>
                        <TableCell>{row.departmentName || '-'}</TableCell>
                        <TableCell>{row.designationName || '-'}</TableCell>
                        <TableCell>{row.salaryMonth}</TableCell>
                        <TableCell>{row.salaryYear}</TableCell>
                        <TableCell>{row.doj}</TableCell>
                        <TableCell>{formatNumber(row.basicSalary)}</TableCell>
                        <TableCell>{formatNumber(row.grossSalary)}</TableCell>

                        {/* Allowances detail */}
                        <TableCell className="text-green-700 max-w-[220px] whitespace-pre-wrap text-xs">
                          {row.allowanceText}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {row.totalAllowance > 0
                            ? formatNumber(row.totalAllowance)
                            : '-'}
                        </TableCell>

                        {/* Deductions detail */}
                        <TableCell className="text-red-700 max-w-[220px] whitespace-pre-wrap text-xs">
                          {row.deductionText}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {row.totalDeduction > 0
                            ? formatNumber(row.totalDeduction)
                            : '-'}
                        </TableCell>

                        <TableCell className="text-blue-600 font-semibold">
                          {formatNumber(row.netSalary)}
                        </TableCell>
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

export default SalaryReport
