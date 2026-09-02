'use client'

import type React from 'react'
import { useMemo, useRef, useState } from 'react'
import {
  Download,
  FileUp,
  Loader2,
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

import { useInitializeUser } from '@/utils/user'
import { useGetAllEmployees, useUploadAttendance } from '@/hooks/use-api'
import { toast } from '@/hooks/use-toast'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

const PAGE_SIZE = 15

const VERIFY_MODE_OPTIONS = ['Fingerprint', 'Face', 'Card', 'Password', 'Other']

type PreviewRow = {
  rowNo: number
  deviceId: string
  employeeId: string
  employeeLabel: string
  punchTime: string
  verifyMode: string
  isValid: boolean
  errorMessage: string
}

const escapeCsvField = (value: string) => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// Builds the exact CSV shape the backend's csv.parse({ columns: true }) expects —
// headers must match CsvPunchRow keys verbatim: device_id, employee_id, punch_time, verify_mode
const buildAttendanceCsvFile = (rows: PreviewRow[]) => {
  const header = 'device_id,employee_id,punch_time,verify_mode'
  const lines = rows.map((r) =>
    [r.deviceId, r.employeeId, r.punchTime, r.verifyMode]
      .map(escapeCsvField)
      .join(',')
  )
  const csvContent = [header, ...lines].join('\r\n')
  return new File([csvContent], `attendance-${Date.now()}.csv`, {
    type: 'text/csv',
  })
}

const UploadAttendance = () => {
  useInitializeUser()

  const { data: employeesRes } = useGetAllEmployees()
  const employees = useMemo(
    () => employeesRes?.data ?? [],
    [employeesRes?.data]
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [page, setPage] = useState(1)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // mutation's own onClose/reset are no-ops here — we control preview
  // clearing ourselves after the whole bulk loop finishes below.
  const uploadMutation = useUploadAttendance({
    onClose: () => {},
    reset: () => {},
  })

  // ── resolve a raw "Employee" cell value against the employee list ──────────
  const resolveEmployee = (raw: string) => {
    const value = String(raw ?? '').trim()
    if (!value) return { employeeId: '', employeeLabel: '' }

    const parts = value.split('|')
    const idPart = parts.length > 1 ? parts[parts.length - 1].trim() : value

    const emp = employees.find((e) => String(e.employeeId) === idPart)
    return {
      employeeId: idPart,
      employeeLabel: emp ? `${emp.empFullName} (${emp.empCode})` : '',
    }
  }

  // ── download xlsx template with employee + verify-mode dropdowns ───────────
  const handleDownloadTemplate = async () => {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()

    const employeeLabels = employees.map(
      (e) => `${e.empFullName} (${e.empCode}) | ${e.employeeId}`
    )

    // hidden lookup sheet
    const lookupSheet = workbook.addWorksheet('Lookup')
    lookupSheet.state = 'veryHidden'

    employeeLabels.forEach((label, idx) => {
      lookupSheet.getCell(`A${idx + 1}`).value = label
    })
    if (employeeLabels.length > 0) {
      workbook.definedNames.add(
        `Lookup!$A$1:$A$${employeeLabels.length}`,
        'EmployeeList'
      )
    }

    VERIFY_MODE_OPTIONS.forEach((mode, idx) => {
      lookupSheet.getCell(`B${idx + 1}`).value = mode
    })
    workbook.definedNames.add(
      `Lookup!$B$1:$B$${VERIFY_MODE_OPTIONS.length}`,
      'VerifyModeList'
    )

    // main sheet
    const sheet = workbook.addWorksheet('Upload Attendance')
    sheet.columns = [
      { header: 'Device ID', key: 'deviceId', width: 16 },
      { header: 'Employee', key: 'employee', width: 40 },
      {
        header: 'Punch Time (MM/DD/YYYY HH:MM:SS AM/PM)',
        key: 'punchTime',
        width: 30,
      },
      { header: 'Verify Mode', key: 'verifyMode', width: 18 },
    ]

    const headerRow = sheet.getRow(1)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF000000' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFBBF24' },
      }
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
    headerRow.height = 30

    for (let row = 2; row <= 201; row++) {
      sheet.getCell(`B${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Employee',
        error: 'Please select an employee from the dropdown.',
        formulae: ['EmployeeList'],
      }
      sheet.getCell(`D${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Invalid Verify Mode',
        error: 'Please select a verify mode from the dropdown.',
        formulae: ['VerifyModeList'],
      }
    }

    sheet.views = [{ state: 'frozen', ySplit: 1 }]

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, 'upload-attendance-template.xlsx')
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  // Used for Date objects built from manually-typed text (local time is correct there)
  const formatPunchTime = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

  // Used only for xlsx-parsed Date cells, which xlsx builds assuming UTC
  // (Excel serials carry no timezone). Local getters here would silently
  // shift the time by the runtime's UTC offset.
  const formatPunchTimeFromExcelDate = (d: Date) =>
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
      d.getUTCDate()
    )} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(
      d.getUTCSeconds()
    )}`

  // Accepts:
  //  - a real Date object (Excel date/time cell, e.g. typed "7/11/2026 3:35:34 PM"
  //    which Excel auto-formats/displays as "7/11/2026 15:45")
  //  - "YYYY-MM-DD HH:mm:ss" (already normalized)
  //  - "M/D/YYYY H:mm:ss AM/PM" (12-hour text)
  //  - "M/D/YYYY H:mm" or "M/D/YYYY H:mm:ss" (24-hour text, no AM/PM — Excel's
  //    display format when typed into a date cell, seconds often dropped)
  // Normalizes all of them to "YYYY-MM-DD HH:mm:ss" for the API.
  const parsePunchTime = (
    raw: unknown
  ): { normalized: string; isValid: boolean } => {
    if (raw instanceof Date && !isNaN(raw.getTime())) {
      return { normalized: formatPunchTimeFromExcelDate(raw), isValid: true }
    }

    const str = String(raw ?? '').trim()
    if (!str) return { normalized: '', isValid: false }

    // already normalized
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(str)) {
      return { normalized: str, isValid: true }
    }

    // 12-hour text: M/D/YYYY H:mm:ss AM/PM
    const usMatch12 = str.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i
    )
    if (usMatch12) {
      const [, month, day, year, hour, minute, second, ampm] = usMatch12
      let h = parseInt(hour, 10)
      if (/pm/i.test(ampm) && h !== 12) h += 12
      if (/am/i.test(ampm) && h === 12) h = 0
      const d = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        h,
        Number(minute),
        Number(second)
      )
      if (!isNaN(d.getTime()))
        return { normalized: formatPunchTime(d), isValid: true }
    }

    // 24-hour text: M/D/YYYY H:mm or M/D/YYYY H:mm:ss (no AM/PM)
    const usMatch24 = str.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    )
    if (usMatch24) {
      const [, month, day, year, hour, minute, second] = usMatch24
      const d = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        second ? Number(second) : 0
      )
      if (!isNaN(d.getTime()))
        return { normalized: formatPunchTime(d), isValid: true }
    }

    // last-resort fallback
    const fallback = new Date(str)
    if (!isNaN(fallback.getTime())) {
      return { normalized: formatPunchTime(fallback), isValid: true }
    }

    return { normalized: str, isValid: false }
  }

  // ── parse the uploaded file into preview rows ───────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const sheetName =
        workbook.SheetNames.find((name) => name === 'Upload Attendance') ??
        workbook.SheetNames.find((name) => name !== 'Lookup') ??
        workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, {
        defval: '',
        raw: false, // return formatted strings, not Date objects/serials
        dateNF: 'yyyy-mm-dd hh:mm:ss', // force this exact format for date-typed cells
      })

      // drop fully-blank rows (trailing empty lines/rows in the source file)
      const rows = rawRows.filter((row) =>
        Object.values(row).some((v) => String(v ?? '').trim() !== '')
      )

      const parsed: PreviewRow[] = rows.map((row, idx) => {
        const deviceId = String(
          row['Device ID'] ?? row['device_id'] ?? ''
        ).trim()
        const employeeRaw = String(
          row['Employee'] ?? row['employee_id'] ?? ''
        ).trim()
        const punchTimeRaw =
          row['Punch Time (MM/DD/YYYY HH:MM:SS AM/PM)'] ??
          row['Punch Time'] ??
          row['punch_time'] ??
          ''
        const verifyMode = String(
          row['Verify Mode'] ?? row['verify_mode'] ?? ''
        ).trim()

        const { employeeId, employeeLabel } = resolveEmployee(employeeRaw)
        const { normalized: punchTime, isValid: punchTimeValid } =
          parsePunchTime(punchTimeRaw)

        let errorMessage = ''
        if (!deviceId) errorMessage = 'Device ID is missing'
        else if (!employeeId || !employeeLabel)
          errorMessage = 'Employee not recognized'
        else if (!punchTimeValid)
          errorMessage = 'Punch time is invalid or missing'
        else if (!verifyMode) errorMessage = 'Verify mode is missing'

        return {
          rowNo: idx + 1,
          deviceId,
          employeeId,
          employeeLabel,
          punchTime,
          verifyMode,
          isValid: !errorMessage,
          errorMessage,
        }
      })

      setPreviewRows(parsed)
      setPage(1)
    } catch (err) {
      console.error('Error parsing attendance file:', err)
      toast({
        title: 'Error',
        variant: 'destructive',
        description:
          'Could not read that file. Please use the downloaded template.',
      })
    } finally {
      e.target.value = ''
    }
  }

  const handleClearPreview = () => {
    setPreviewRows([])
    setFileName('')
    setPage(1)
  }

  const validRows = useMemo(
    () => previewRows.filter((r) => r.isValid),
    [previewRows]
  )
  const invalidCount = previewRows.length - validRows.length

  // ── build CSV from validated rows and submit as a single multipart file ───
  const handleConfirmSubmit = async () => {
    setConfirmOpen(false)
    setIsSubmitting(true)

    try {
      const csvFile = buildAttendanceCsvFile(validRows)
      const formData = new FormData()
      formData.append('file', csvFile)

      const res = await uploadMutation.mutateAsync(formData)

      if (res?.errors?.length) {
        console.warn('Rows skipped by backend:', res.errors)
      }
    } catch (err) {
      console.error('Attendance CSV upload failed:', err)
    } finally {
      setIsSubmitting(false)
      handleClearPreview()
    }
  }

  const totalPages = Math.max(1, Math.ceil(previewRows.length / PAGE_SIZE))
  const paginatedRows = useMemo(
    () => previewRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [previewRows, page]
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-md">
            <UploadCloud className="text-blue-600 h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">Upload Attendance</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="h-9 bg-transparent"
          >
            <Download className="h-4 w-4 mr-1" />
            Download Template
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-500 hover:bg-blue-600 text-white h-9"
          >
            <FileUp className="h-4 w-4 mr-1" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Summary / actions bar */}
      {previewRows.length > 0 && (
        <div className="border rounded-lg p-4 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{fileName}</span> —{' '}
              {previewRows.length} row(s) found
              {invalidCount > 0 && (
                <span className="text-red-600 ml-2">
                  ({invalidCount} invalid)
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearPreview}
                className="h-8"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={validRows.length === 0 || isSubmitting}
                className="bg-blue-500 hover:bg-blue-600 text-white h-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  `Submit ${validRows.length} Record(s)`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead>Device ID</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Punch Time</TableHead>
              <TableHead>Verify Mode</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-400"
                >
                  No file uploaded yet. Download the template, fill it in, then
                  upload it here.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((r) => (
                <TableRow
                  key={r.rowNo}
                  className={!r.isValid ? 'bg-red-50' : ''}
                >
                  <TableCell>{r.rowNo}</TableCell>
                  <TableCell className="text-sm">{r.deviceId || '—'}</TableCell>
                  <TableCell className="text-sm">
                    {r.employeeLabel || (
                      <span className="text-red-500">Unrecognized</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {r.punchTime || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {r.verifyMode || '—'}
                  </TableCell>
                  <TableCell>
                    {r.isValid ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                        <AlertCircle className="h-3.5 w-3.5" /> {r.errorMessage}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - Updated with ellipsis and smart page display like Attendance Processing */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, index) => {
                if (
                  index === 0 ||
                  index === totalPages - 1 ||
                  (index >= page - 3 && index <= page + 1)
                ) {
                  return (
                    <PaginationItem key={`page-${index}`}>
                      <PaginationLink
                        onClick={() => setPage(index + 1)}
                        isActive={page === index + 1}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                } else if (index === page - 4 || index === page + 2) {
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
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={
                    page === totalPages ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Confirm Upload Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Attendance Upload</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-500">
            {validRows.length} valid record(s) will be uploaded.
            {invalidCount > 0 &&
              ` ${invalidCount} invalid row(s) will be skipped.`}
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSubmit}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Confirm & Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UploadAttendance
