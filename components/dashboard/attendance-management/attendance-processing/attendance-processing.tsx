'use client'

import type React from 'react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CalendarClock,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Umbrella,
  CalendarOff,
  AlertCircle,
  CalendarDays,
} from 'lucide-react'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useProcessAttendanceDate,
  useProcessAttendanceRange,
  useGetAllAttendanceDailyWithParams,
  // TODO: confirm the real hook name/path for fetching the employee list used
  // elsewhere for CustomCombobox (e.g. in ProbationPromotionPopup / ShiftAllocationPage)
  useGetAllEmployees,
} from '@/hooks/use-api'
import type {
  ProcessAttendanceResultType,
  GetAttendanceDailyType,
  GetEmployeeType,
} from '@/utils/type'
import { CustomCombobox } from '@/utils/custom-combobox'
import { formatDate } from '@/utils/conversions'
// TODO: confirm the actual import path for CustomCombobox in this project

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string }> = {
    PRESENT: { label: 'Present', className: 'bg-green-100 text-green-700' },
    ABSENT: { label: 'Absent', className: 'bg-red-100 text-red-600' },
    LATE: { label: 'Late', className: 'bg-yellow-100 text-yellow-700' },
    HALF_DAY: { label: 'Half Day', className: 'bg-orange-100 text-orange-700' },
    HOLIDAY: { label: 'Holiday', className: 'bg-purple-100 text-purple-700' },
    WEEKEND: { label: 'Weekend', className: 'bg-blue-100 text-blue-600' },
    ON_LEAVE: { label: 'On Leave', className: 'bg-teal-100 text-teal-700' },
  }
  const s = map[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600',
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}
    >
      {s.label}
    </span>
  )
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard = ({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}) => (
  <div className={`flex items-center gap-3 p-3 rounded-lg border ${color}`}>
    <div className="opacity-70">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  </div>
)

// ─── Process Result Card ──────────────────────────────────────────────────────
const ProcessResultCard = ({
  result,
}: {
  result: ProcessAttendanceResultType
}) => (
  <div className="border rounded-lg p-4 space-y-3">
    <div className="flex items-center justify-between">
      <span className="font-medium text-sm">{result.date}</span>
      <span className="text-xs text-gray-500">
        {result.processed} employees
      </span>
    </div>
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3 text-green-500" />
        <span>Present: {result.summary.present}</span>
      </div>
      <div className="flex items-center gap-1">
        <XCircle className="h-3 w-3 text-red-500" />
        <span>Absent: {result.summary.absent}</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3 text-yellow-500" />
        <span>Late: {result.summary.late}</span>
      </div>
      <div className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3 text-orange-500" />
        <span>Half Day: {result.summary.halfDay}</span>
      </div>
      <div className="flex items-center gap-1">
        <Umbrella className="h-3 w-3 text-purple-500" />
        <span>Holiday: {result.summary.holiday}</span>
      </div>
      <div className="flex items-center gap-1">
        <CalendarOff className="h-3 w-3 text-blue-500" />
        <span>Weekend: {result.summary.weekend}</span>
      </div>
    </div>
  </div>
)

// ─── Format time ──────────────────────────────────────────────────────────────
const formatTime = (val: string | null) => {
  if (!val) return '—'
  return new Date(val).toLocaleTimeString('en-BD', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Format minutes as Xh Ym ──────────────────────────────────────────────────
const formatMinutes = (val: number | null) => {
  if (val === null || val === undefined) return '—'
  const h = Math.floor(val / 60)
  const m = val % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AttendanceProcessing = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  // ── Single date processing ──
  const [singleDate, setSingleDate] = useState('')
  const [singleResult, setSingleResult] =
    useState<ProcessAttendanceResultType | null>(null)

  // ── Range processing ──
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [rangeResults, setRangeResults] = useState<
    ProcessAttendanceResultType[]
  >([])

  // ── Attendance (daily) tab filters ──
  // These now drive the query directly — no "Search" button needed.
  // Selecting/clearing any filter re-fetches automatically.
  const [attendanceEmployee, setAttendanceEmployee] = useState<{
    id: string
    name: string
  } | null>(null)
  const [attendanceFromDate, setAttendanceFromDate] = useState('')
  const [attendanceToDate, setAttendanceToDate] = useState('')

  // ── Mutations ──
  const dateMutation = useProcessAttendanceDate()
  const rangeMutation = useProcessAttendanceRange()

  // ── Attendance (daily) query — driven live by filter state ──
  const attendanceEmployeeId = attendanceEmployee
    ? Number(attendanceEmployee.id)
    : undefined

  const { data: attendanceData, isLoading: attendanceLoading } =
    useGetAllAttendanceDailyWithParams(
      attendanceEmployeeId,
      attendanceFromDate || undefined,
      attendanceToDate || undefined
    )

  // TODO: verify actual response shape — assumed axios response.data.data like the audit log endpoint
  const attendanceLogs: GetAttendanceDailyType[] = attendanceData?.data ?? []

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

  // ── Process single date ──
  const handleProcessDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!singleDate) return
    const res = await dateMutation.mutateAsync({ date: singleDate })
    if (res?.data) setSingleResult(res.data)
  }

  // ── Process range ──
  const handleProcessRange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromDate || !toDate) return
    const res = await rangeMutation.mutateAsync({ fromDate, toDate })
    if (res?.data?.results) setRangeResults(res.data.results)
  }

  // ── Reset attendance filters ──
  const handleAttendanceReset = () => {
    setAttendanceEmployee(null)
    setAttendanceFromDate('')
    setAttendanceToDate('')
  }

  // ── Range summary totals ──
  const rangeTotals = useMemo(() => {
    return rangeResults.reduce(
      (acc, r) => ({
        present: acc.present + r.summary.present,
        absent: acc.absent + r.summary.absent,
        late: acc.late + r.summary.late,
        halfDay: acc.halfDay + r.summary.halfDay,
        holiday: acc.holiday + r.summary.holiday,
        weekend: acc.weekend + r.summary.weekend,
      }),
      { present: 0, absent: 0, late: 0, halfDay: 0, holiday: 0, weekend: 0 }
    )
  }, [rangeResults])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="bg-blue-100 p-2 rounded-md">
          <CalendarClock className="text-blue-600 h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">Attendance Processing</h2>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="single">
        <TabsList className="mb-4">
          <TabsTrigger value="single">Process Single Date</TabsTrigger>
          <TabsTrigger value="range">Process Date Range</TabsTrigger>
          <TabsTrigger value="attendance">
            <CalendarDays className="h-4 w-4 mr-1" />
            Attendance
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Single Date ── */}
        <TabsContent value="single" className="space-y-4">
          <div className="border rounded-lg p-4">
            <form onSubmit={handleProcessDate} className="flex items-end gap-4">
              <div className="space-y-1">
                <Label htmlFor="singleDate">Attendance Date</Label>
                <Input
                  id="singleDate"
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  required
                  className="w-48"
                />
              </div>
              <Button
                type="submit"
                disabled={dateMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {dateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process'
                )}
              </Button>
            </form>
          </div>

          {/* Single date result */}
          {singleResult && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Result — {singleResult.date}</h3>
                <span className="text-sm text-gray-500">
                  {singleResult.processed} employees processed
                </span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                <SummaryCard
                  label="Present"
                  value={singleResult.summary.present}
                  icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                  color="border-green-200 bg-green-50"
                />
                <SummaryCard
                  label="Absent"
                  value={singleResult.summary.absent}
                  icon={<XCircle className="h-4 w-4 text-red-500" />}
                  color="border-red-200 bg-red-50"
                />
                <SummaryCard
                  label="Late"
                  value={singleResult.summary.late}
                  icon={<Clock className="h-4 w-4 text-yellow-600" />}
                  color="border-yellow-200 bg-yellow-50"
                />
                <SummaryCard
                  label="Half Day"
                  value={singleResult.summary.halfDay}
                  icon={<AlertCircle className="h-4 w-4 text-orange-500" />}
                  color="border-orange-200 bg-orange-50"
                />
                <SummaryCard
                  label="Holiday"
                  value={singleResult.summary.holiday}
                  icon={<Umbrella className="h-4 w-4 text-purple-600" />}
                  color="border-purple-200 bg-purple-50"
                />
                <SummaryCard
                  label="Weekend"
                  value={singleResult.summary.weekend}
                  icon={<CalendarOff className="h-4 w-4 text-blue-500" />}
                  color="border-blue-200 bg-blue-50"
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Tab 2: Date Range ── */}
        <TabsContent value="range" className="space-y-4">
          <div className="border rounded-lg p-4">
            <form
              onSubmit={handleProcessRange}
              className="flex items-end gap-4 flex-wrap"
            >
              <div className="space-y-1">
                <Label htmlFor="fromDate">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                  className="w-48"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                  className="w-48"
                />
              </div>
              <Button
                type="submit"
                disabled={rangeMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {rangeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process Range'
                )}
              </Button>
            </form>
          </div>

          {/* Range totals */}
          {rangeResults.length > 0 && (
            <>
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-sm">
                  Total Summary — {rangeResults.length} days
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  <SummaryCard
                    label="Present"
                    value={rangeTotals.present}
                    icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                    color="border-green-200 bg-green-50"
                  />
                  <SummaryCard
                    label="Absent"
                    value={rangeTotals.absent}
                    icon={<XCircle className="h-4 w-4 text-red-500" />}
                    color="border-red-200 bg-red-50"
                  />
                  <SummaryCard
                    label="Late"
                    value={rangeTotals.late}
                    icon={<Clock className="h-4 w-4 text-yellow-600" />}
                    color="border-yellow-200 bg-yellow-50"
                  />
                  <SummaryCard
                    label="Half Day"
                    value={rangeTotals.halfDay}
                    icon={<AlertCircle className="h-4 w-4 text-orange-500" />}
                    color="border-orange-200 bg-orange-50"
                  />
                  <SummaryCard
                    label="Holiday"
                    value={rangeTotals.holiday}
                    icon={<Umbrella className="h-4 w-4 text-purple-600" />}
                    color="border-purple-200 bg-purple-50"
                  />
                  <SummaryCard
                    label="Weekend"
                    value={rangeTotals.weekend}
                    icon={<CalendarOff className="h-4 w-4 text-blue-500" />}
                    color="border-blue-200 bg-blue-50"
                  />
                </div>
              </div>

              {/* Per-day cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rangeResults.map((r) => (
                  <ProcessResultCard key={r.date} result={r} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Tab 3: Attendance (daily records) ── */}
        <TabsContent value="attendance" className="space-y-4">
          {/* Filters — auto-apply on change, no Search button */}
          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Filters</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Employee</Label>
                <CustomCombobox
                  items={employeeItems}
                  value={attendanceEmployee}
                  onChange={(value) => setAttendanceEmployee(value)}
                  placeholder="Select employee"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">From Date</Label>
                <Input
                  type="date"
                  value={attendanceFromDate}
                  onChange={(e) => setAttendanceFromDate(e.target.value)}
                  className="w-40 h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">To Date</Label>
                <Input
                  type="date"
                  value={attendanceToDate}
                  onChange={(e) => setAttendanceToDate(e.target.value)}
                  className="w-40 h-8 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAttendanceReset}
                  className="h-8"
                >
                  Reset
                </Button>
              </div>
            </div>
            {attendanceLogs.length > 0 && (
              <p className="text-xs text-gray-500">
                {attendanceLogs.length} records found
              </p>
            )}
          </div>

          {/* Attendance Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-blue-100">
                <TableRow>
                  <TableHead>Sl No.</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>First In</TableHead>
                  <TableHead>Last Out</TableHead>
                  <TableHead>Worked</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Early Out</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-500" />
                    </TableCell>
                  </TableRow>
                ) : attendanceLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-gray-400"
                    >
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceLogs.map((log, index) => (
                    <TableRow key={log.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {log.employeeName ?? '—'}
                          </p>
                          <p className="text-xs text-gray-400">{log.empCode}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(new Date(log.attendanceDate))}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {formatTime(log.firstIn)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {formatTime(log.lastOut)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {formatMinutes(log.workedMinutes)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {formatMinutes(log.lateMinutes)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {formatMinutes(log.earlyOutMinutes)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {formatMinutes(log.overtimeMinutes)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={log.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AttendanceProcessing
