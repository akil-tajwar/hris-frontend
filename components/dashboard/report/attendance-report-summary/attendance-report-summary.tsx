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
import { useGetAttendanceSummaryReport } from '@/hooks/use-api'
import { AttendanceSummaryType } from '@/utils/type'

const AttendanceSummaryReport = () => {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: response } = useGetAttendanceSummaryReport(fromDate, toDate)

  // response → response.data → response.data.data → array
  const records: AttendanceSummaryType[] = useMemo(() => {
    if (!response) return []
    const raw = (response as any)?.data?.data
    return Array.isArray(raw) ? raw : []
  }, [response])

  const grand = useMemo(
    () =>
      records.reduce(
        (acc, r: AttendanceSummaryType) => ({
          present: acc.present + r.present,
          absent: acc.absent + r.absent,
          late: acc.late + r.late,
          halfDay: acc.halfDay + r.halfDay,
          total: acc.total + r.total,
        }),
        { present: 0, absent: 0, late: 0, halfDay: 0, total: 0 }
      ),
    [records]
  )

  const exportToExcel = () => {
    const flatData = records.map((r: AttendanceSummaryType) => ({
      Date: r.date,
      Present: r.present,
      Absent: r.absent,
      Late: r.late,
      'Half Day': r.halfDay,
      Total: r.total,
    }))
    const ws = XLSX.utils.json_to_sheet(flatData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Summary')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(
      new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `attendance-summary-${fromDate}-to-${toDate}.xlsx`
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Attendance Summary Report</h2>
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
      <div className="flex items-end gap-4 print:hidden">
        <div className="space-y-2">
          <Label htmlFor="from-date" className="text-sm font-medium">
            From Date:
          </Label>
          <Input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-48"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to-date" className="text-sm font-medium">
            To Date:
          </Label>
          <Input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      {/* Table */}
      {!fromDate || !toDate ? (
        <Card className="shadow-md">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-blue-600">
              Please select both from and to dates to view the summary
            </p>
          </CardContent>
        </Card>
      ) : records.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="p-8 text-center text-gray-500">
            No records found for selected date range
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-blue-100">
                <TableRow>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold text-green-700">
                    Present
                  </TableHead>
                  <TableHead className="font-bold text-red-700">
                    Absent
                  </TableHead>
                  <TableHead className="font-bold text-yellow-700">
                    Late
                  </TableHead>
                  <TableHead className="font-bold text-orange-700">
                    Half Day
                  </TableHead>
                  <TableHead className="font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r: AttendanceSummaryType) => (
                  <TableRow key={r.date}>
                    <TableCell className="font-medium">{r.date}</TableCell>
                    <TableCell className="text-green-700 font-medium">
                      {r.present}
                    </TableCell>
                    <TableCell className="text-red-700 font-medium">
                      {r.absent}
                    </TableCell>
                    <TableCell className="text-yellow-700 font-medium">
                      {r.late}
                    </TableCell>
                    <TableCell className="text-orange-700 font-medium">
                      {r.halfDay}
                    </TableCell>
                    <TableCell>{r.total}</TableCell>
                  </TableRow>
                ))}
                {/* Grand Total */}
                <TableRow className="bg-blue-50 border-t-2 border-blue-200">
                  <TableCell className="font-bold">Grand Total</TableCell>
                  <TableCell className="text-green-700 font-bold">
                    {grand.present}
                  </TableCell>
                  <TableCell className="text-red-700 font-bold">
                    {grand.absent}
                  </TableCell>
                  <TableCell className="text-yellow-700 font-bold">
                    {grand.late}
                  </TableCell>
                  <TableCell className="text-orange-700 font-bold">
                    {grand.halfDay}
                  </TableCell>
                  <TableCell className="font-bold">{grand.total}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AttendanceSummaryReport
