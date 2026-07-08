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
import { FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { useGetShiftReport } from '@/hooks/use-api'
import { cn } from '@/lib/utils'
import { GetShiftReportType } from '@/utils/type'

const ShiftTypeBadge = ({ type }: { type: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    Fixed: { label: 'Fixed', cls: 'bg-green-100 text-green-700' },
    Flexible: { label: 'Flexible', cls: 'bg-blue-100 text-blue-700' },
    Rotational: { label: 'Rotational', cls: 'bg-purple-100 text-purple-700' },
  }
  const { label, cls } = map[type] ?? {
    label: type,
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

const formatTime = (time: string | null) => {
  if (!time) return '-'
  // expects "HH:mm" or "HH:mm:ss" style strings
  const [h, m] = time.split(':')
  if (h === undefined || m === undefined) return time
  const d = new Date()
  d.setHours(Number(h), Number(m), 0)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const formatDate = (iso: string | null) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const ShiftReport = () => {
  const [date, setDate] = useState('')

  const { data: response } = useGetShiftReport(date)
  console.log("🚀 ~ ShiftReport ~ response:", response)

  // response → response.data → response.data.data → array
  const records: GetShiftReportType[] = useMemo(() => {
  if (!response) return []
  const raw = (response as any)?.data
  return Array.isArray(raw) ? raw : []
}, [response])

  const summary = useMemo(
    () =>
      records.reduce(
        (
          acc: {
            fixed: number
            flexible: number
            rotational: number
            crossDay: number
          },
          r: GetShiftReportType
        ) => {
          if (r.shiftType === 'Fixed') acc.fixed++
          else if (r.shiftType === 'Flexible') acc.flexible++
          else if (r.shiftType === 'Rotational') acc.rotational++
          if (r.crossDay) acc.crossDay++
          return acc
        },
        { fixed: 0, flexible: 0, rotational: 0, crossDay: 0 }
      ),
    [records]
  )

  const exportToExcel = () => {
    const flatData = records.map((r: GetShiftReportType) => ({
      'Emp Code': r.empCode,
      'Employee Name': r.employeeName,
      'Shift Code': r.shiftCode,
      'Shift Name': r.shiftName,
      'Shift Type': r.shiftType,
      'Start Time': formatTime(r.startTime),
      'End Time': formatTime(r.endTime),
      'Break (min)': r.breakMinutes,
      'Expected Work Hours': r.expectedWorkHours,
      'Min Hours For Present': r.minimumHoursForPresent,
      'Cross Day': r.crossDay ? 'Yes' : 'No',
      Flexible: r.isFlexible ? 'Yes' : 'No',
      'Flexible In From': formatTime(r.flexibleInFrom),
      'Flexible In To': formatTime(r.flexibleInTo),
      'Effective From': formatDate(r.effectiveFrom),
      'Effective To': formatDate(r.effectiveTo),
      'Recurrence Type': r.recurrenceType ?? '-',
      'Recurrence Active': r.recurrenceActive,
      Remarks: r.remarks ?? '-',
    }))
    const ws = XLSX.utils.json_to_sheet(flatData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Shift Report')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(
      new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `shift-report-${date}.xlsx`
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shift Report</h2>
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
          <Label htmlFor="date" className="text-sm font-medium">
            Date:
          </Label>
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
            {
              label: 'Fixed',
              value: summary.fixed,
              cls: 'bg-green-50 border-green-200 text-green-700',
            },
            {
              label: 'Flexible',
              value: summary.flexible,
              cls: 'bg-blue-50 border-blue-200 text-blue-700',
            },
            {
              label: 'Rotational',
              value: summary.rotational,
              cls: 'bg-purple-50 border-purple-200 text-purple-700',
            },
            {
              label: 'Cross Day',
              value: summary.crossDay,
              cls: 'bg-orange-50 border-orange-200 text-orange-700',
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
      <div id="shift-report-content">
        {!date ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-blue-600">
                Please select a date to view the report
              </p>
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
                      <TableHead className="font-bold">Shift Code</TableHead>
                      <TableHead className="font-bold">Shift Name</TableHead>
                      <TableHead className="font-bold">Type</TableHead>
                      <TableHead className="font-bold">Start</TableHead>
                      <TableHead className="font-bold">End</TableHead>
                      <TableHead className="font-bold">Break (min)</TableHead>
                      <TableHead className="font-bold">Expected Hrs</TableHead>
                      <TableHead className="font-bold">Min Hrs</TableHead>
                      <TableHead className="font-bold">Cross Day</TableHead>
                      <TableHead className="font-bold">
                        Effective From
                      </TableHead>
                      <TableHead className="font-bold">Effective To</TableHead>
                      <TableHead className="font-bold">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r: GetShiftReportType, i: number) => {
                      return (
                        <TableRow
                          key={i}
                          className={cn(
                            r.crossDay && 'bg-orange-50 hover:bg-orange-50'
                          )}
                        >
                          <TableCell>{r.empCode}</TableCell>
                          <TableCell>{r.employeeName}</TableCell>
                          <TableCell>{r.shiftCode}</TableCell>
                          <TableCell>{r.shiftName}</TableCell>
                          <TableCell>
                            <ShiftTypeBadge type={r.shiftType} />
                          </TableCell>
                          <TableCell>{formatTime(r.startTime)}</TableCell>
                          <TableCell>{formatTime(r.endTime)}</TableCell>
                          <TableCell>{r.breakMinutes ?? 0}</TableCell>
                          <TableCell>{r.expectedWorkHours ?? 0}</TableCell>
                          <TableCell>{r.minimumHoursForPresent ?? 0}</TableCell>
                          <TableCell>{r.crossDay ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{formatDate(r.effectiveFrom)}</TableCell>
                          <TableCell>{formatDate(r.effectiveTo)}</TableCell>
                          <TableCell>{r.remarks ?? '-'}</TableCell>
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

export default ShiftReport
