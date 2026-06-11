'use client'

import { useState } from 'react'
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
import {
  useGetEmployeeActivityReport,
  useGetAllEmployees,
} from '@/hooks/use-api'
import { formatDate } from '@/utils/conversions'
import { CustomCombobox } from '@/utils/custom-combobox'

const SectionCard = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <Card className="shadow-sm">
    <CardContent className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-blue-700 border-b pb-1">
        {title}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {children}
      </div>
    </CardContent>
  </Card>
)

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <span className="text-gray-500">{label}:</span>{' '}
    <span className="font-medium">{value ?? '-'}</span>
  </div>
)

const EmployeeActivityReport = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(0)

  const { data: employees } = useGetAllEmployees()
  const { data: activityReport } =
    useGetEmployeeActivityReport(selectedEmployeeId)

  const employeeDetails = activityReport?.data?.employeeDetails
  const employeeHistory = activityReport?.data?.employeeHistory ?? []

  const exportToExcel = () => {
    const flatData = employeeHistory.map((history) => ({
      'Event Date': formatDate(new Date(history.eventDate)),
      'Employment Event Type': history.employeeEventType,
      'Effective From': formatDate(new Date(history.effectiveFrom)),
      Remarks: history.remarsk,
      'Performed By': history.performedBy,
      'Approved By': history.approvedBy,
      'Reference Type': history.referenceType,
      'Reference ID': history.referenceId,
      'Created At': history.createdAt,
    }))

    const worksheet = XLSX.utils.json_to_sheet(flatData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Report')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })
    saveAs(
      blob,
      `activity-report-${employeeDetails?.empCode ?? 'employee'}.xlsx`
    )
  }

  const generatePdf = async () => {
    const targetRef = document.getElementById('activity-report-content')
    if (!targetRef) return
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
      pdf.setFont('bold')
      pdf.text('School Management System', horizontalPadding, 35)
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
      pdf.setFont('normal')
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - horizontalPadding - 50,
        pageHeight - marginBottom + 20
      )
    }

    pdf.save(`activity-report-${employeeDetails?.empCode ?? 'employee'}.pdf`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Activity Report</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToExcel}
            variant="ghost"
            className="flex items-center gap-2 bg-green-100 text-green-900 hover:bg-green-200"
            disabled={employeeHistory.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={generatePdf}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 print:hidden"
            disabled={employeeHistory.length === 0}
          >
            <File className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-end gap-4 print:hidden">
        <div className="space-y-2 w-96">
          <Label className="text-sm font-medium">Employee:</Label>
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
      </div>

      {/* Report Content */}
      {!selectedEmployeeId ? (
        <Card className="shadow-md">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-blue-600">
              Please select an employee to view the activity report
            </p>
          </CardContent>
        </Card>
      ) : (
        <div id="activity-report-content" className="space-y-4">
          {/* Employee Details */}
          {employeeDetails && (
            <>
              {/* Basic Information */}
              <SectionCard title="Basic Information">
                <Field label="Emp Code" value={employeeDetails.empCode} />
                <Field label="Full Name" value={employeeDetails.empFullName} />
                <Field
                  label="Short Name"
                  value={employeeDetails.empShortName}
                />
                <Field
                  label="Date of Birth"
                  value={formatDate(new Date(employeeDetails.dob))}
                />
                <Field
                  label="Date of Joining"
                  value={formatDate(new Date(employeeDetails.doj))}
                />
                <Field
                  label="Date of Confirmation"
                  value={
                    employeeDetails.doc
                      ? formatDate(new Date(employeeDetails.doc))
                      : '-'
                  }
                />
                <Field label="Gender" value={employeeDetails.gender} />
                <Field
                  label="National ID"
                  value={employeeDetails.nationalIdNo}
                />
                <Field
                  label="Nationality"
                  value={employeeDetails.nationality}
                />
                <Field label="Country" value={employeeDetails.country} />
                <Field label="City" value={employeeDetails.city} />
                <Field label="Zip Code" value={employeeDetails.zipCode} />
              </SectionCard>

              {/* Contact Information */}
              <SectionCard title="Contact Information">
                <Field label="Work Email" value={employeeDetails.workEmail} />
                <Field
                  label="Private Email"
                  value={employeeDetails.privateEmail}
                />
                <Field
                  label="Official Phone"
                  value={employeeDetails.officialPhone}
                />
                <Field
                  label="Personal Phone"
                  value={employeeDetails.personalPhone}
                />
                <Field label="Home Phone" value={employeeDetails.homePhone} />
              </SectionCard>

              {/* Address Information */}
              <SectionCard title="Address Information">
                <Field
                  label="Present Address"
                  value={employeeDetails.presentAddress}
                />
                <Field
                  label="Permanent Address"
                  value={employeeDetails.permanentAddress}
                />
              </SectionCard>

              {/* Emergency Contact */}
              <SectionCard title="Emergency Contact">
                <Field
                  label="Name"
                  value={employeeDetails.emergencyContactName}
                />
                <Field
                  label="Phone"
                  value={employeeDetails.emergencyContactPhone}
                />
                <Field
                  label="Relation"
                  value={employeeDetails.emergencyContactRelation}
                />
              </SectionCard>

              {/* Personal Information */}
              <SectionCard title="Personal Information">
                <Field
                  label="Marital Status"
                  value={employeeDetails.maritalStatus}
                />
                <Field label="Religion" value={employeeDetails.religion} />
                <Field label="Blood Group" value={employeeDetails.bloodGroup} />
              </SectionCard>

              {/* Qualification Information */}
              <SectionCard title="Qualification Information">
                <Field
                  label="Qualification"
                  value={employeeDetails.qualification}
                />
                <Field
                  label="Institute"
                  value={employeeDetails.instituteName}
                />
                <Field label="Subject" value={employeeDetails.subjectName} />
                <Field
                  label="Start Date"
                  value={
                    employeeDetails.startDate
                      ? formatDate(new Date(employeeDetails.startDate))
                      : '-'
                  }
                />
                <Field
                  label="End Date"
                  value={
                    employeeDetails.endDate
                      ? formatDate(new Date(employeeDetails.endDate))
                      : '-'
                  }
                />
                <Field label="Result" value={employeeDetails.result} />
              </SectionCard>

              {/* Employment Information */}
              <SectionCard title="Employment Information">
                <Field
                  label="Basic Salary"
                  value={employeeDetails.basicSalary}
                />
                <Field
                  label="Status"
                  value={
                    <span
                      className={
                        employeeDetails.isActive
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {employeeDetails.isActive ? 'Active' : 'Inactive'}
                    </span>
                  }
                />
                <Field label="Shift" value={employeeDetails.shift} />
              </SectionCard>

              {/* Dependents Information */}
              <SectionCard title="Dependents Information">
                <Field
                  label="Dependent Name"
                  value={employeeDetails.dependentsName}
                />
                <Field
                  label="Relation"
                  value={employeeDetails.dependentRelation}
                />
              </SectionCard>
            </>
          )}

          {/* Activity History Table */}
          {employeeHistory.length === 0 ? (
            <Card className="shadow-md">
              <CardContent className="p-8 text-center text-gray-500">
                No activity records found for the selected employee
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-md">
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <Table>
                    <TableHeader className="bg-blue-100">
                      <TableRow>
                        <TableHead className="font-bold">Event Date</TableHead>
                        <TableHead className="font-bold">
                          Employment Event Type
                        </TableHead>
                        <TableHead className="font-bold">
                          Effective From
                        </TableHead>
                        <TableHead className="font-bold">Remarks</TableHead>
                        <TableHead className="font-bold">
                          Performed By
                        </TableHead>
                        <TableHead className="font-bold">Approved By</TableHead>
                        <TableHead className="font-bold">
                          Reference Type
                        </TableHead>
                        <TableHead className="font-bold">
                          Reference ID
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeHistory.map((history, index) => (
                        <TableRow key={history.employeeLifeCycleId ?? index}>
                          <TableCell>
                            {formatDate(new Date(history.eventDate))}
                          </TableCell>
                          <TableCell>{history.employeeEventType}</TableCell>
                          <TableCell>
                            {formatDate(new Date(history.effectiveFrom))}
                          </TableCell>
                          <TableCell>{history.remarsk}</TableCell>
                          <TableCell>{history.performedBy}</TableCell>
                          <TableCell>{history.approvedBy}</TableCell>
                          <TableCell>{history.referenceType}</TableCell>
                          <TableCell>{history.referenceId}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default EmployeeActivityReport
