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
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import {
  useGetAllAttendanceDailyWithParams,
  useGetAllEmployees,
} from '@/hooks/use-api'
import { cn } from '@/lib/utils'
import { CustomCombobox } from '@/utils/custom-combobox'
import { formatDate } from '@/utils/conversions'
import type { GetAttendanceDailyType, GetEmployeeType } from '@/utils/type'

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    PRESENT: { label: 'Present', cls: 'bg-green-100 text-green-700' },
    ABSENT: { label: 'Absent', cls: 'bg-red-100 text-red-600' },
    LATE: { label: 'Late', cls: 'bg-yellow-100 text-yellow-700' },
    HALF_DAY: { label: 'Half Day', cls: 'bg-orange-100 text-orange-700' },
    HOLIDAY: { label: 'Holiday', cls: 'bg-purple-100 text-purple-700' },
    WEEKEND: { label: 'Weekend', cls: 'bg-blue-100 text-blue-600' },
    ON_LEAVE: { label: 'On Leave', cls: 'bg-teal-100 text-teal-700' },
  }
  const { label, cls } = map[status] ?? {
    label: status,
    cls: 'bg-gray-100 text-gray-600',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        cls
      )}
    >
      {label}
    </span>
  )
}

// ─── Formatters ────────────────────────────────────────────────────────────────
const formatTime = (val: string | null) => {
  if (!val) return '—'
  return new Date(val).toLocaleTimeString('en-BD', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatMinutes = (val: number | null) => {
  if (val === null || val === undefined) return '—'
  const h = Math.floor(val / 60)
  const m = val % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

const IndividualAttendanceReport = () => {
  // ── Filters ──
  const [employee, setEmployee] = useState<{ id: string; name: string } | null>(
    null
  )
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const employeeId = employee ? Number(employee.id) : undefined

  const { data: response, isLoading } = useGetAllAttendanceDailyWithParams(
    employeeId,
    fromDate || undefined,
    toDate || undefined
  )

  // TODO: verify actual response shape — assumed axios response.data.data like the shift report endpoint
  const records: GetAttendanceDailyType[] = useMemo(() => {
    if (!response) return []
    const raw = (response as any)?.data
    return Array.isArray(raw) ? raw : []
  }, [response])

  // ── Employee list for CustomCombobox ──
  const { data: employeesData } = useGetAllEmployees()
  const employeeItems = useMemo(
    () =>
      (employeesData?.data ?? []).map((emp: GetEmployeeType) => ({
        id: emp.employeeId!.toString(),
        name: `${emp.empCode} - ${emp.empFullName}`,
      })),
    [employeesData]
  )

  // ── Summary counts ──
  const summary = useMemo(
    () =>
      records.reduce(
        (
          acc: {
            present: number
            absent: number
            late: number
            halfDay: number
            holiday: number
            weekend: number
            onLeave: number
          },
          r: GetAttendanceDailyType
        ) => {
          if (r.status === 'PRESENT') acc.present++
          else if (r.status === 'ABSENT') acc.absent++
          else if (r.status === 'LATE') acc.late++
          else if (r.status === 'HALF_DAY') acc.halfDay++
          else if (r.status === 'HOLIDAY') acc.holiday++
          else if (r.status === 'WEEKEND') acc.weekend++
          else if (r.status === 'ON_LEAVE') acc.onLeave++
          return acc
        },
        {
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          holiday: 0,
          weekend: 0,
          onLeave: 0,
        }
      ),
    [records]
  )

  const handleReset = () => {
    setEmployee(null)
    setFromDate('')
    setToDate('')
  }

  const exportToExcel = () => {
    const flatData = records.map((r: GetAttendanceDailyType) => ({
      'Emp Code': r.empCode,
      'Employee Name': r.employeeName,
      Date: formatDate(new Date(r.attendanceDate)),
      'First In': formatTime(r.firstIn),
      'Last Out': formatTime(r.lastOut),
      Worked: formatMinutes(r.workedMinutes),
      Late: formatMinutes(r.lateMinutes),
      'Early Out': formatMinutes(r.earlyOutMinutes),
      Overtime: formatMinutes(r.overtimeMinutes),
      Status: r.status,
    }))
    const ws = XLSX.utils.json_to_sheet(flatData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(
      new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `individual-attendance-report-${fromDate || 'all'}${
        toDate ? `-to-${toDate}` : ''
      }.xlsx`
    )
  }

  const hasFilters = Boolean(employee || fromDate || toDate)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Individual Attendance Report</h2>
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
      <div className="flex items-end gap-4 flex-wrap print:hidden">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Employee</Label>
          <CustomCombobox
            items={employeeItems}
            value={employee}
            onChange={(value) => setEmployee(value)}
            placeholder="Select employee"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fromDate" className="text-sm font-medium">
            From Date
          </Label>
          <Input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-48"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="toDate" className="text-sm font-medium">
            To Date
          </Label>
          <Input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-48"
          />
        </div>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {/* Summary Cards */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            {
              label: 'Present',
              value: summary.present,
              cls: 'bg-green-50 border-green-200 text-green-700',
            },
            {
              label: 'Absent',
              value: summary.absent,
              cls: 'bg-red-50 border-red-200 text-red-600',
            },
            {
              label: 'Late',
              value: summary.late,
              cls: 'bg-yellow-50 border-yellow-200 text-yellow-700',
            },
            {
              label: 'Half Day',
              value: summary.halfDay,
              cls: 'bg-orange-50 border-orange-200 text-orange-700',
            },
            {
              label: 'Holiday',
              value: summary.holiday,
              cls: 'bg-purple-50 border-purple-200 text-purple-700',
            },
            {
              label: 'Weekend',
              value: summary.weekend,
              cls: 'bg-blue-50 border-blue-200 text-blue-600',
            },
            {
              label: 'On Leave',
              value: summary.onLeave,
              cls: 'bg-teal-50 border-teal-200 text-teal-700',
            },
          ].map(({ label, value, cls }) => (
            <Card key={label} className={cn('border', cls)}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{value}</p>
                <p className="text-sm font-medium mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table */}
      <div id="individual-attendance-report-content">
        {!hasFilters ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-blue-600">
                Please select an employee or date range to view the report
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-500" />
            </CardContent>
          </Card>
        ) : records.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              No attendance records found
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-blue-100">
                    <TableRow>
                      <TableHead className="font-bold">Sl No.</TableHead>
                      <TableHead className="font-bold">Employee</TableHead>
                      <TableHead className="font-bold">Date</TableHead>
                      <TableHead className="font-bold">First In</TableHead>
                      <TableHead className="font-bold">Last Out</TableHead>
                      <TableHead className="font-bold">Worked</TableHead>
                      <TableHead className="font-bold">Late</TableHead>
                      <TableHead className="font-bold">Early Out</TableHead>
                      <TableHead className="font-bold">Overtime</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r: GetAttendanceDailyType, index: number) => (
                      <TableRow key={r.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">
                              {r.employeeName ?? '—'}
                            </p>
                            <p className="text-xs text-gray-400">{r.empCode}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(new Date(r.attendanceDate))}
                        </TableCell>
                        <TableCell>{formatTime(r.firstIn)}</TableCell>
                        <TableCell>{formatTime(r.lastOut)}</TableCell>
                        <TableCell>{formatMinutes(r.workedMinutes)}</TableCell>
                        <TableCell>{formatMinutes(r.lateMinutes)}</TableCell>
                        <TableCell>
                          {formatMinutes(r.earlyOutMinutes)}
                        </TableCell>
                        <TableCell>
                          {formatMinutes(r.overtimeMinutes)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
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

export default IndividualAttendanceReport
