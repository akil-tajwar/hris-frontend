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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CalendarClock,
  History,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Umbrella,
  CalendarOff,
  AlertCircle,
} from 'lucide-react'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useProcessAttendanceDate,
  useProcessAttendanceRange,
  useGetAttendanceAuditLogs,
} from '@/hooks/use-api'
import type {
  ProcessAttendanceResultType,
  AttendanceAuditType,
} from '@/utils/type'

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string }> = {
    PRESENT:  { label: 'Present',  className: 'bg-green-100 text-green-700' },
    ABSENT:   { label: 'Absent',   className: 'bg-red-100 text-red-600' },
    LATE:     { label: 'Late',     className: 'bg-yellow-100 text-yellow-700' },
    HALF_DAY: { label: 'Half Day', className: 'bg-orange-100 text-orange-700' },
    HOLIDAY:  { label: 'Holiday',  className: 'bg-purple-100 text-purple-700' },
    WEEKEND:  { label: 'Weekend',  className: 'bg-blue-100 text-blue-600' },
    ON_LEAVE: { label: 'On Leave', className: 'bg-teal-100 text-teal-700' },
  }
  const s = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  )
}

// ─── Action Badge ─────────────────────────────────────────────────────────────
const ActionBadge = ({ action }: { action: string }) => (
  <span
    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      action === 'INSERT'
        ? 'bg-green-100 text-green-700'
        : 'bg-blue-100 text-blue-700'
    }`}
  >
    {action}
  </span>
)

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
const ProcessResultCard = ({ result }: { result: ProcessAttendanceResultType }) => (
  <div className="border rounded-lg p-4 space-y-3">
    <div className="flex items-center justify-between">
      <span className="font-medium text-sm">{result.date}</span>
      <span className="text-xs text-gray-500">{result.processed} employees</span>
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

// ─── Main Component ───────────────────────────────────────────────────────────
const AttendanceProcessing = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  // ── Single date processing ──
  const [singleDate, setSingleDate] = useState('')
  const [singleResult, setSingleResult] = useState<ProcessAttendanceResultType | null>(null)

  // ── Range processing ──
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [rangeResults, setRangeResults] = useState<ProcessAttendanceResultType[]>([])

  // ── Audit filters ──
  const [auditPage, setAuditPage] = useState(1)
  const [auditLimit] = useState(20)
  const [auditEmployeeId, setAuditEmployeeId] = useState('')
  const [auditFromDate, setAuditFromDate] = useState('')
  const [auditToDate, setAuditToDate] = useState('')
  const [auditAction, setAuditAction] = useState<'INSERT' | 'UPDATE' | ''>('')

  // ── Applied audit filters (only when search is clicked) ──
  const [appliedFilters, setAppliedFilters] = useState<{
    employeeId?: number
    fromDate?: string
    toDate?: string
    action?: 'INSERT' | 'UPDATE'
    page: number
    limit: number
  }>({ page: 1, limit: 20 })

  // ── Mutations ──
  const dateMutation  = useProcessAttendanceDate()
  const rangeMutation = useProcessAttendanceRange()

  // ── Audit query ──
  const { data: auditData, isLoading: auditLoading } = useGetAttendanceAuditLogs(appliedFilters)

  const auditLogs: AttendanceAuditType[] = auditData?.data?.data ?? []
  const auditTotal      = auditData?.data?.total ?? 0
  const auditTotalPages = auditData?.data?.totalPages ?? 1

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

  // ── Apply audit filters ──
  const handleAuditSearch = () => {
    setAuditPage(1)
    setAppliedFilters({
      employeeId: auditEmployeeId ? Number(auditEmployeeId) : undefined,
      fromDate:   auditFromDate || undefined,
      toDate:     auditToDate   || undefined,
      action:     auditAction   || undefined,
      page:       1,
      limit:      auditLimit,
    })
  }

  const handleAuditPageChange = (page: number) => {
    setAuditPage(page)
    setAppliedFilters((prev) => ({ ...prev, page }))
  }

  const handleAuditReset = () => {
    setAuditEmployeeId('')
    setAuditFromDate('')
    setAuditToDate('')
    setAuditAction('')
    setAuditPage(1)
    setAppliedFilters({ page: 1, limit: auditLimit })
  }

  // ── Range summary totals ──
  const rangeTotals = useMemo(() => {
    return rangeResults.reduce(
      (acc, r) => ({
        present:  acc.present  + r.summary.present,
        absent:   acc.absent   + r.summary.absent,
        late:     acc.late     + r.summary.late,
        halfDay:  acc.halfDay  + r.summary.halfDay,
        holiday:  acc.holiday  + r.summary.holiday,
        weekend:  acc.weekend  + r.summary.weekend,
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
          <TabsTrigger value="audit">
            <History className="h-4 w-4 mr-1" />
            Audit Log
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
                <h3 className="font-medium">
                  Result — {singleResult.date}
                </h3>
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
            <form onSubmit={handleProcessRange} className="flex items-end gap-4 flex-wrap">
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
                  <SummaryCard label="Present"  value={rangeTotals.present}  icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}  color="border-green-200 bg-green-50" />
                  <SummaryCard label="Absent"   value={rangeTotals.absent}   icon={<XCircle className="h-4 w-4 text-red-500" />}         color="border-red-200 bg-red-50" />
                  <SummaryCard label="Late"     value={rangeTotals.late}     icon={<Clock className="h-4 w-4 text-yellow-600" />}         color="border-yellow-200 bg-yellow-50" />
                  <SummaryCard label="Half Day" value={rangeTotals.halfDay}  icon={<AlertCircle className="h-4 w-4 text-orange-500" />}   color="border-orange-200 bg-orange-50" />
                  <SummaryCard label="Holiday"  value={rangeTotals.holiday}  icon={<Umbrella className="h-4 w-4 text-purple-600" />}      color="border-purple-200 bg-purple-50" />
                  <SummaryCard label="Weekend"  value={rangeTotals.weekend}  icon={<CalendarOff className="h-4 w-4 text-blue-500" />}     color="border-blue-200 bg-blue-50" />
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

        {/* ── Tab 3: Audit Log ── */}
        <TabsContent value="audit" className="space-y-4">
          {/* Filters */}
          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Filters</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Employee ID</Label>
                <Input
                  type="number"
                  placeholder="e.g. 6"
                  value={auditEmployeeId}
                  onChange={(e) => setAuditEmployeeId(e.target.value)}
                  className="w-32 h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">From Date</Label>
                <Input
                  type="date"
                  value={auditFromDate}
                  onChange={(e) => setAuditFromDate(e.target.value)}
                  className="w-40 h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">To Date</Label>
                <Input
                  type="date"
                  value={auditToDate}
                  onChange={(e) => setAuditToDate(e.target.value)}
                  className="w-40 h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Action</Label>
                <Select
                  value={auditAction || 'all'}
                  onValueChange={(v) =>
                    setAuditAction(v === 'all' ? '' : (v as 'INSERT' | 'UPDATE'))
                  }
                >
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="INSERT">INSERT</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAuditSearch}
                  className="bg-blue-500 hover:bg-blue-600 text-white h-8"
                >
                  Search
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAuditReset}
                  className="h-8"
                >
                  Reset
                </Button>
              </div>
            </div>
            {auditTotal > 0 && (
              <p className="text-xs text-gray-500">
                {auditTotal} records found
              </p>
            )}
          </div>

          {/* Audit Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-blue-100">
                <TableRow>
                  <TableHead>Sl No.</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Old Status</TableHead>
                  <TableHead>New Status</TableHead>
                  <TableHead>Old In/Out</TableHead>
                  <TableHead>New In/Out</TableHead>
                  <TableHead>Changed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-500" />
                    </TableCell>
                  </TableRow>
                ) : auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log, index) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {(appliedFilters.page - 1) * auditLimit + index + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{log.employeeName ?? '—'}</p>
                          <p className="text-xs text-gray-400">{log.empCode}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{log.attendanceDate}</TableCell>
                      <TableCell>
                        <ActionBadge action={log.action} />
                      </TableCell>
                      <TableCell>
                        {log.oldStatus ? (
                          <StatusBadge status={log.oldStatus} />
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={log.newStatus} />
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {log.oldFirstIn || log.oldLastOut ? (
                          <>
                            <span>{formatTime(log.oldFirstIn)}</span>
                            <span className="mx-1">→</span>
                            <span>{formatTime(log.oldLastOut)}</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {log.newFirstIn || log.newLastOut ? (
                          <>
                            <span>{formatTime(log.newFirstIn)}</span>
                            <span className="mx-1">→</span>
                            <span>{formatTime(log.newLastOut)}</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {log.changedAt
                          ? new Date(log.changedAt).toLocaleString('en-BD', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Audit Pagination */}
          {auditTotalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handleAuditPageChange(Math.max(auditPage - 1, 1))}
                      className={auditPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {[...Array(auditTotalPages)].map((_, index) => {
                    if (
                      index === 0 ||
                      index === auditTotalPages - 1 ||
                      (index >= auditPage - 2 && index <= auditPage + 2)
                    ) {
                      return (
                        <PaginationItem key={`page-${index}`}>
                          <PaginationLink
                            onClick={() => handleAuditPageChange(index + 1)}
                            isActive={auditPage === index + 1}
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    } else if (index === auditPage - 3 || index === auditPage + 3) {
                      return (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationLink>...</PaginationLink>
                        </PaginationItem>
                      )
                    }
                    return null
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        handleAuditPageChange(Math.min(auditPage + 1, auditTotalPages))
                      }
                      className={
                        auditPage === auditTotalPages ? 'pointer-events-none opacity-50' : ''
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AttendanceProcessing