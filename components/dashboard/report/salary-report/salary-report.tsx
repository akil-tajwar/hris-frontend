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
import { Fragment } from 'react'
import { File, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useGetAllEmployees, useGetSalaryReport } from '@/hooks/use-api'
import { formatDate, formatNumber } from '@/utils/conversions'
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

type SalaryRecord = GetSalaryType[number]
type OtherSalaryItem = SalaryRecord['otherSalary'][number]

// Helper: split an employee's otherSalary items into allowances/deductions + totals
const groupOtherSalary = (otherSalaries: OtherSalaryItem[]) => {
  const allowances = otherSalaries.filter(
    (o) => o.componentType === 'Allowance'
  )
  const deductions = otherSalaries.filter(
    (o) => o.componentType === 'Deduction'
  )

  const totalAllowance = allowances.reduce((sum, o) => sum + o.amount, 0)
  const totalDeduction = deductions.reduce((sum, o) => sum + o.amount, 0)

  const formatComponents = (items: OtherSalaryItem[]): string =>
    items.length > 0
      ? items
          .map((item) => `${item.componentName}: ${formatNumber(item.amount)}`)
          .join(', ')
      : '-'

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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const { data: salaryReports } = useGetSalaryReport(salaryMonth, salaryYear)
  console.log('🚀 ~ SalaryReport ~ salaryReports:', salaryReports)
  const { data: employees } = useGetAllEmployees()
  console.log('🚀 ~ SalaryReport ~ employees:', employees)

  // Enrich each employee's record with derived allowance/deduction summaries
  const enrichedSalaryData = useMemo(() => {
    const records: GetSalaryType = (salaryReports?.data || []).flat()

    return records.map((record) => {
      const { allowanceText, deductionText, totalAllowance, totalDeduction } =
        groupOtherSalary(record.otherSalary)

      return {
        ...record,
        allowanceText,
        deductionText,
        totalAllowance,
        totalDeduction,
      }
    })
  }, [salaryReports])

  const toggleRow = (salaryId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(salaryId)) {
        next.delete(salaryId)
      } else {
        next.add(salaryId)
      }
      return next
    })
  }

  const exportToExcel = () => {
    const flatData = enrichedSalaryData.map((row) => ({
      Employee: [
        row.salary.empCode,
        row.salary.employeeName,
        row.salary.designationName,
        row.salary.departmentName,
      ]
        .filter(Boolean)
        .join(' - '),
      'Date of Joining': formatDate(new Date(row.salary.doj)),
      'Basic Salary': formatNumber(row.salary.basicSalary),
      'Gross Salary': formatNumber(row.salary.grossSalary),
      Allowances: row.allowanceText,
      'Total Allowance': formatNumber(row.totalAllowance),
      Deductions: row.deductionText,
      'Total Deduction': formatNumber(row.totalDeduction),
      'Net Salary': formatNumber(row.salary.netSalary),
      Status: row.salary.isDraft ? 'Draft' : 'Permanent',
      'Salary Given': row.salary.isSalaryGiven ? 'Given' : 'Not Given',
    }))

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
      pdf.text('HRIS', leftTextMargin, 35)

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
                  <TableHeader className="bg-blue-100 pdf-table-header">
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="font-bold w-20">SI No.</TableHead>
                      <TableHead className="font-bold">Employee</TableHead>
                      <TableHead className="font-bold">
                        Date of Joining
                      </TableHead>
                      <TableHead className="font-bold">Basic Salary</TableHead>
                      <TableHead className="font-bold">Gross Salary</TableHead>
                      <TableHead className="font-bold">Net Salary</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Salary Given</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {enrichedSalaryData.map((row, index) => {
                      const { salary } = row
                      const isExpanded = expandedRows.has(salary.salaryId)

                      const employeeDetails = [
                        salary.empCode,
                        salary.employeeName,
                        salary.designationName,
                        salary.departmentName,
                      ]
                        .filter(Boolean)
                        .join(' - ')

                      return (
                        <Fragment key={salary.salaryId}>
                          <TableRow
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleRow(salary.salaryId)}
                          >
                            <TableCell>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="w-20">{index + 1}</TableCell>
                            <TableCell>{employeeDetails || '-'}</TableCell>
                            <TableCell>
                              {formatDate(new Date(salary.doj))}
                            </TableCell>
                            <TableCell>
                              {formatNumber(salary.basicSalary)}
                            </TableCell>
                            <TableCell>
                              {formatNumber(salary.grossSalary)}
                            </TableCell>
                            <TableCell className="text-blue-600 font-semibold">
                              {formatNumber(salary.netSalary)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  salary.isDraft
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    : 'bg-green-50 text-green-700 border-green-200'
                                }
                              >
                                {salary.isDraft ? 'Draft' : 'Permanent'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  salary.isSalaryGiven
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-gray-50 text-gray-500 border-gray-200'
                                }
                              >
                                {salary.isSalaryGiven ? 'Given' : 'Not Given'}
                              </Badge>
                            </TableCell>
                          </TableRow>

                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={9} className="bg-gray-50 p-0">
                                <div className="p-4">
                                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
                                    Other Salary Components —{' '}
                                    {salary.salaryMonth} {salary.salaryYear}
                                  </p>
                                  {row.otherSalary.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                      No other salary components for this
                                      employee.
                                    </p>
                                  ) : (
                                    <>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="w-20">
                                              SI No.
                                            </TableHead>
                                            <TableHead>Component</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">
                                              Amount
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {row.otherSalary.map((item, i) => (
                                            <TableRow
                                              key={item.salaryComponentId}
                                            >
                                              <TableCell className="w-20">
                                                {i + 1}
                                              </TableCell>
                                              <TableCell className="font-medium">
                                                {item.componentName}
                                              </TableCell>
                                              <TableCell>
                                                <Badge
                                                  variant="outline"
                                                  className={
                                                    item.componentType ===
                                                    'Allowance'
                                                      ? 'bg-green-50 text-green-700 border-green-200'
                                                      : 'bg-red-50 text-red-700 border-red-200'
                                                  }
                                                >
                                                  {item.componentType}
                                                </Badge>
                                              </TableCell>
                                              <TableCell
                                                className={`text-right font-medium ${
                                                  item.componentType ===
                                                  'Allowance'
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                }`}
                                              >
                                                {item.componentType ===
                                                'Allowance'
                                                  ? '+'
                                                  : '-'}
                                                {formatNumber(item.amount)}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                      <div className="flex items-center gap-6 pt-3 mt-3 border-t text-sm">
                                        <span className="text-green-600 font-medium">
                                          Total Allowances: +
                                          {formatNumber(row.totalAllowance)}
                                        </span>
                                        <span className="text-red-600 font-medium">
                                          Total Deductions: -
                                          {formatNumber(row.totalDeduction)}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
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

export default SalaryReport
