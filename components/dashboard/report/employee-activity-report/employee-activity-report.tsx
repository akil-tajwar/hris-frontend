'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { File, Users, ClipboardList, Award } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  useGetEmployeeActivityReport,
  useGetAllEmployees,
} from '@/hooks/use-api'
import { formatDate } from '@/utils/conversions'
import { CustomCombobox } from '@/utils/custom-combobox'

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => {
  const isEmpty = value === null || value === undefined || value === ''
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={
          isEmpty
            ? 'text-sm text-slate-300'
            : 'text-sm font-medium text-slate-700'
        }
      >
        {isEmpty ? 'Not provided' : value}
      </p>
    </div>
  )
}

const SectionHeading = ({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) => (
  <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-700 border-b pb-2">
    <Icon className="h-4 w-4" />
    {children}
  </h3>
)

const yearsBetween = (start: Date, end: Date) => {
  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  if (end.getDate() < start.getDate()) months -= 1
  if (months < 0) {
    years -= 1
    months += 12
  }
  if (years <= 0 && months <= 0) return 'Less than a month'
  const parts: string[] = []
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`)
  if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`)
  return parts.join(' ')
}

// Map event type -> badge color
const actionBadgeClass = (eventType: string) => {
  const type = eventType?.toLowerCase() ?? ''
  if (
    type.includes('hire') ||
    type.includes('join') ||
    type.includes('onboard')
  )
    return 'bg-slate-100 text-slate-600'
  if (type.includes('promot')) return 'bg-emerald-100 text-emerald-700'
  if (type.includes('transfer')) return 'bg-blue-100 text-blue-700'
  if (type.includes('confirm')) return 'bg-violet-100 text-violet-700'
  if (type.includes('asset')) return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

// oldValue / newValue are objects with a single (or first) key whose value
// is the human-readable role/asset/etc, e.g. { designationName: "Senior Manager" }
const firstValue = (obj: Record<string, unknown> | null | undefined) => {
  if (!obj) return null
  const values = Object.values(obj)
  return values.length > 0 ? String(values[0]) : null
}

// Dummy placeholders until real data is wired up
const DUMMY_PERFORMANCE_HISTORY = [
  {
    year: '2025',
    rating: '4.5 / 5.0 (Exceeds)',
    notes: 'Led Q3 product launch; generated $2M in pipeline.',
  },
  {
    year: '2024',
    rating: '4.0 / 5.0 (Meets+)',
    notes: 'Successfully migrated CRM data; zero downtime.',
  },
  {
    year: '2023',
    rating: '4.0 / 5.0 (Meets+)',
    notes: 'Completed advanced digital analytics certification.',
  },
]

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const EmployeeActivityReport = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(0)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const { data: employees } = useGetAllEmployees()
  const {
    data: activityReport,
    isLoading,
    isError,
  } = useGetEmployeeActivityReport(selectedEmployeeId)

  const employeeDetails = activityReport?.data?.employeeDetails
  const employeeHistory = activityReport?.data?.employeeHistory ?? []

  const hasReport = !!selectedEmployeeId
  const exportDisabled = !hasReport || isLoading || !employeeDetails

  const generatePdf = async () => {
    const targetRef = document.getElementById('activity-report-content')
    if (!targetRef) return

    setIsExportingPdf(true)
    try {
      await new Promise((res) => setTimeout(res, 200))

      const canvas = await html2canvas(targetRef, { scale: 2, useCORS: true })

      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })

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

      const totalPages = pdf.internal.pages.length - 1
      const today = new Date()
      const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
      const monthName = today.toLocaleDateString('en-US', { month: 'long' })
      const day = today.getDate()
      const year = today.getFullYear()

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('HRIS', horizontalPadding, 35)
        pdf.setFontSize(10)
        const empLabel = employeeDetails
          ? `${employeeDetails.empCode} - ${employeeDetails.empFullName}`
          : 'Employee'
        const baseText = `Activity Report for ${empLabel} ( Date : `
        pdf.text(baseText, horizontalPadding, 50)
        let currentX = horizontalPadding + pdf.getTextWidth(baseText)
        pdf.text(dayName, currentX, 50)
        currentX += pdf.getTextWidth(dayName)
        pdf.text(', ', currentX, 50)
        currentX += pdf.getTextWidth(', ')
        pdf.text(monthName, currentX, 50)
        currentX += pdf.getTextWidth(monthName)
        pdf.text(` ${day}, ${year} )`, currentX, 50)
        pdf.setFont('helvetica', 'normal')
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - horizontalPadding - 50,
          pageHeight - marginBottom + 20
        )
      }

      pdf.save(`activity-report-${employeeDetails?.empCode ?? 'employee'}.pdf`)
    } finally {
      setIsExportingPdf(false)
    }
  }

  const tenure = employeeDetails?.doj
    ? yearsBetween(new Date(employeeDetails.doj), new Date())
    : null

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="px-6 py-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Employee Activity Report
            </h1>
            <p className="text-sm text-slate-500">
              View an employee&rsquo;s profile and full activity history.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5 w-72">
              <Label className="text-xs font-medium text-slate-500">
                Employee
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
                        id: selectedEmployeeId.toString(),
                        name: (() => {
                          const emp = employees?.data?.find(
                            (e) => e.employeeId === selectedEmployeeId
                          )
                          return emp
                            ? `${emp.empCode} - ${emp.empFullName} - ${emp.departmentName} - ${emp.designationName}`
                            : ''
                        })(),
                      }
                    : null
                }
                onChange={(value) =>
                  setSelectedEmployeeId(value ? Number(value.id) : 0)
                }
                placeholder="Select employee"
              />
            </div>

            <Button
              onClick={generatePdf}
              variant="outline"
              className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 print:hidden"
              disabled={exportDisabled || isExportingPdf}
            >
              <File className="h-4 w-4" />
              {isExportingPdf ? 'Generating…' : 'PDF'}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6">
        {/* Empty state */}
        {!hasReport && (
          <Card className="border-dashed border-slate-300 bg-white shadow-none">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Users className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">
                No employee selected
              </p>
              <p className="text-sm text-slate-400">
                Choose an employee above to view their profile and activity
                history.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {hasReport && isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-28 rounded-xl bg-slate-200" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="h-80 rounded-xl bg-slate-200" />
              <div className="h-80 rounded-xl bg-slate-200" />
            </div>
          </div>
        )}

        {/* Error state */}
        {hasReport && isError && (
          <Card className="border-rose-200 bg-rose-50 shadow-none">
            <CardContent className="py-8 text-center">
              <p className="text-sm font-medium text-rose-700">
                Couldn&rsquo;t load this report
              </p>
              <p className="mt-1 text-sm text-rose-500">
                Something went wrong while fetching activity data. Try selecting
                the employee again.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loaded content */}
        {hasReport && !isLoading && !isError && employeeDetails && (
          <div id="activity-report-content" className="space-y-6">
            {/* Profile summary */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  <Field
                    label="Employee Name"
                    value={employeeDetails.empFullName}
                  />
                  <Field label="Employee ID" value={employeeDetails.empCode} />
                  <Field
                    label="Current Title"
                    value={employeeDetails.designationName}
                  />
                  <Field
                    label="Department"
                    value={employeeDetails.departmentName}
                  />
                  <Field label="Reporting Manager" value={null} />
                  <Field
                    label="Original Hire Date"
                    value={formatDate(new Date(employeeDetails.doj))}
                  />
                  <Field label="Total Tenure" value={tenure} />
                  <Field
                    label="Status"
                    value={
                      <span
                        className={
                          employeeDetails.isActive
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }
                      >
                        {employeeDetails.isActive ? 'Active' : 'Inactive'}
                      </span>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Two-column body */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left column: Personal & Admin */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4 space-y-5">
                  <SectionHeading icon={Users}>
                    Personal &amp; Admin
                  </SectionHeading>

                  <div className="space-y-3 border-b pb-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Contact Information
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Work Email"
                        value={employeeDetails.workEmail}
                      />
                      <Field
                        label="Work Phone"
                        value={employeeDetails.officialPhone}
                      />
                      <Field
                        label="Personal Email"
                        value={employeeDetails.privateEmail}
                      />
                      <Field
                        label="Personal Phone"
                        value={employeeDetails.personalPhone}
                      />
                      <div className="col-span-2">
                        <Field
                          label="Address"
                          value={employeeDetails.presentAddress}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-b pb-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Demographics &amp; Compliance
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Date of Birth"
                        value={formatDate(new Date(employeeDetails.dob))}
                      />
                      <Field
                        label="Nationality"
                        value={employeeDetails.nationality}
                      />
                      <Field
                        label="National ID"
                        value={employeeDetails.nationalIdNo}
                      />
                      <Field label="Gender" value={employeeDetails.gender} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Emergency Contact
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <Field
                        label="Name"
                        value={employeeDetails.emergencyContactName}
                      />
                      <Field
                        label="Relationship"
                        value={employeeDetails.emergencyContactRelation}
                      />
                      <Field
                        label="Phone"
                        value={employeeDetails.emergencyContactPhone}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Compensation &amp; Leave (YTD)
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <Field label="Base Salary" value="—" />
                      <Field label="Last Review" value="—" />
                      <Field label="PTO Balance" value="—" />
                      <Field label="Sick Leave" value="—" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right column: Organizational Journey & Performance */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4 space-y-5">
                  <SectionHeading icon={ClipboardList}>
                    Organizational Journey &amp; Performance
                  </SectionHeading>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Career Progression Timeline
                    </p>

                    {employeeHistory.length === 0 ? (
                      <div className="flex flex-col items-center gap-1 py-8 text-center">
                        <ClipboardList className="h-5 w-5 text-slate-300" />
                        <p className="text-sm font-medium text-slate-500">
                          No events recorded
                        </p>
                        <p className="text-xs text-slate-400">
                          Hiring, promotions, transfers and other events will
                          appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-auto rounded-lg">
                        <Table className='border border-slate-200'>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead className="text-xs">Date</TableHead>
                              <TableHead className="text-xs">Action</TableHead>
                              <TableHead className="text-xs">
                                Previous Role
                              </TableHead>
                              <TableHead className="text-xs">
                                New Role / Notes
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {employeeHistory.map((history, index) => {
                              const previous = firstValue(history.oldValue)
                              const next = firstValue(history.newValue)
                              return (
                                <TableRow
                                  key={history.employeeLifeCycleId ?? index}
                                >
                                  <TableCell className="whitespace-nowrap text-sm text-slate-500">
                                    {formatDate(new Date(history.eventDate))}
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={
                                        'inline-flex rounded px-2 py-0.5 text-xs font-medium ' +
                                        actionBadgeClass(
                                          history.employeeEventType
                                        )
                                      }
                                    >
                                      {history.employeeEventType}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-sm text-slate-600">
                                    {previous ?? '—'}
                                  </TableCell>
                                  <TableCell className="text-sm text-slate-600">
                                    {next ?? history.remarks ?? '—'}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" />
                      Performance History
                    </p>
                    <div className="overflow-auto rounded-lg max-h-">
                      <Table className='border border-slate-200'>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="text-xs">Year</TableHead>
                            <TableHead className="text-xs">Rating</TableHead>
                            <TableHead className="text-xs">
                              Key Achievements / Manager Notes
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {DUMMY_PERFORMANCE_HISTORY.map((row) => (
                            <TableRow key={row.year}>
                              <TableCell className="text-sm text-slate-500">
                                {row.year}
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {row.rating}
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {row.notes}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeActivityReport
