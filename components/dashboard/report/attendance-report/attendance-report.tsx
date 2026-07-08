'use client'

import { useState, useMemo } from 'react'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { useGetDailyAttendanceReport } from '@/hooks/use-api'
import { cn } from '@/lib/utils'
import { DailyAttendanceType } from '@/utils/type'

const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toUpperCase()
  const map: Record<string, { label: string; cls: string }> = {
    PRESENT:  { label: 'Present',  cls: 'bg-green-100 text-green-700' },
    ABSENT:   { label: 'Absent',   cls: 'bg-red-200 text-red-800' },
    LATE:     { label: 'Late',     cls: 'bg-yellow-100 text-yellow-700' },
    HALF_DAY: { label: 'Half Day', cls: 'bg-orange-100 text-orange-700' },
  }
  const { label, cls } = map[s] ?? { label: s, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', cls)}>
      {label}
    </span>
  )
}

const formatTime = (iso: string | null) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

const DailyAttendanceReport = () => {
  const [date, setDate] = useState('')

  const { data: response } = useGetDailyAttendanceReport(date)

  // response → response.data → response.data.data → array
  const records: DailyAttendanceType[] = useMemo(() => {
    if (!response) return []
    const raw = (response as any)?.data?.data
    return Array.isArray(raw) ? raw : []
  }, [response])

  const summary = useMemo(() => records.reduce(
    (acc: { present: number; absent: number; late: number; halfDay: number }, r: DailyAttendanceType) => {
      const s = r.status?.toUpperCase()
      if (s === 'PRESENT')       acc.present++
      else if (s === 'ABSENT')   acc.absent++
      else if (s === 'LATE')     acc.late++
      else if (s === 'HALF_DAY') acc.halfDay++
      return acc
    },
    { present: 0, absent: 0, late: 0, halfDay: 0 }
  ), [records])

  const exportToExcel = () => {
    const flatData = records.map((r: DailyAttendanceType) => ({
      'Emp Code': r.empCode,
      'Employee Name': r.employeeName,
      Department: r.departmentName,
      Designation: r.designationName,
      Status: r.status,
      'First In': formatTime(r.firstIn),
      'Last Out': formatTime(r.lastOut),
      'Worked (min)': r.workedMinutes,
      'Late (min)': r.lateMinutes,
      'Early Out (min)': r.earlyOutMinutes,
      'Overtime (min)': r.overtimeMinutes,
    }))
    const ws = XLSX.utils.json_to_sheet(flatData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Attendance')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(
      new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `daily-attendance-${date}.xlsx`
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Daily Attendance Report</h2>
        <Button
          onClick={exportToExcel}
          variant="ghost"
          className="flex items-center gap-2 bg-green-100 text-green-900 hover:bg-green-200"
          disabled={records.length === 0}
        >
          <FileSpreadsheet className="h-4 w-4" /> Excel
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-end gap-4 print:hidden">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-medium">Date:</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {records.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Present',  value: summary.present,  cls: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Absent',   value: summary.absent,   cls: 'bg-red-50 border-red-200 text-red-700' },
            { label: 'Late',     value: summary.late,     cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            { label: 'Half Day', value: summary.halfDay,  cls: 'bg-orange-50 border-orange-200 text-orange-700' },
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
      <div id="daily-attendance-content">
        {!date ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-blue-600">Please select a date to view the report</p>
            </CardContent>
          </Card>
        ) : records.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center text-gray-500">
              No records found for selected date
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
                      <TableHead className="font-bold">Name</TableHead>
                      <TableHead className="font-bold">Department</TableHead>
                      <TableHead className="font-bold">Designation</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">First In</TableHead>
                      <TableHead className="font-bold">Last Out</TableHead>
                      <TableHead className="font-bold">Worked (min)</TableHead>
                      <TableHead className="font-bold">Late (min)</TableHead>
                      <TableHead className="font-bold">Early Out (min)</TableHead>
                      <TableHead className="font-bold">OT (min)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r: DailyAttendanceType, i: number) => {
                      const s = r.status?.toUpperCase()
                      return (
                        <TableRow
                          key={i}
                          className={cn(
                            s === 'ABSENT'   && 'bg-red-50 hover:bg-red-50',
                            s === 'LATE'     && 'bg-yellow-50 hover:bg-yellow-50',
                            s === 'HALF_DAY' && 'bg-orange-50 hover:bg-orange-50',
                          )}
                        >
                          <TableCell>{r.empCode}</TableCell>
                          <TableCell>{r.employeeName}</TableCell>
                          <TableCell>{r.departmentName}</TableCell>
                          <TableCell>{r.designationName}</TableCell>
                          <TableCell><StatusBadge status={r.status} /></TableCell>
                          <TableCell>{formatTime(r.firstIn)}</TableCell>
                          <TableCell>{formatTime(r.lastOut)}</TableCell>
                          <TableCell>{r.workedMinutes ?? 0}</TableCell>
                          <TableCell className={cn(r.lateMinutes > 0 && 'text-red-600 font-medium')}>
                            {r.lateMinutes ?? 0}
                          </TableCell>
                          <TableCell className={cn(r.earlyOutMinutes > 0 && 'text-red-600 font-medium')}>
                            {r.earlyOutMinutes ?? 0}
                          </TableCell>
                          <TableCell>{r.overtimeMinutes ?? 0}</TableCell>
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

export default DailyAttendanceReport