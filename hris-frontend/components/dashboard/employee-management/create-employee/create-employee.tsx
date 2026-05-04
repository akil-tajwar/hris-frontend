'use client'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { User, Upload, Download } from 'lucide-react'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { CustomCombobox } from '@/utils/custom-combobox'
import {
  useAddEmployee,
  useGetDepartments,
  useGetDesignations,
  useGetEmployeeTypes,
  useGetLeaveTypes,
  useGetOfficeTimingWeekends,
} from '@/hooks/use-api'
import type { CreateEmployeeType } from '@/utils/type'
import { toast } from '@/hooks/use-toast'
import ExcelFileInput from '@/utils/excel-file-input'
import { Popup } from '@/utils/popup'
import { saveAs } from 'file-saver'
import { formatTime } from '@/utils/conversions'

// ── Static column definitions ─────────────────────────────────────────────────
const STATIC_COLUMNS = [
  { header: 'Full Name', key: 'empFullName', width: 24, required: true }, // A 1
  { header: 'workEmail', key: 'workEmail', width: 28, required: false }, // B 2
  { header: 'Official Phone', key: 'officialPhone', width: 18, required: true }, // C 3
  {
    header: 'Personal Phone',
    key: 'personalPhone',
    width: 18,
    required: false,
  }, // D 4
  {
    header: 'Present Address',
    key: 'presentAddress',
    width: 30,
    required: true,
  }, // E 5
  {
    header: 'Permanent Address',
    key: 'permanentAddress',
    width: 30,
    required: false,
  }, // F 6
  {
    header: 'Emergency Contact Name',
    key: 'emergencyContactName',
    width: 24,
    required: false,
  }, // G 7
  {
    header: 'Emergency Contact Phone',
    key: 'emergencyContactPhone',
    width: 22,
    required: false,
  }, // H 8
  { header: 'Date of Birth', key: 'dob', width: 14, required: true }, // I 9
  { header: 'Date of Joining', key: 'doj', width: 14, required: true }, // J 10
  { header: 'Gender', key: 'gender', width: 10, required: true }, // K 11
  { header: 'Blood Group', key: 'bloodGroup', width: 12, required: false }, // L 12
  { header: 'Basic Salary', key: 'basicSalary', width: 14, required: false }, // M 13
  { header: 'Gross Salary', key: 'grossSalary', width: 14, required: true }, // N 14
  { header: 'Employee Code', key: 'empCode', width: 16, required: true }, // O 15
  { header: 'Department', key: 'departmentId', width: 30, required: true }, // P 16
  { header: 'Designation', key: 'designationId', width: 30, required: true }, // Q 17
  { header: 'Employee Type', key: 'employeeTypeId', width: 24, required: true }, // R 18
  {
    header: 'Office Timing',
    key: 'officeTimingId',
    width: 36,
    required: false,
  }, // S 19
]
// Leave-type columns appended dynamically starting at col 20

const CreateEmployee = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const router = useRouter()

  const { data: departments } = useGetDepartments()
  const { data: designations } = useGetDesignations()
  const { data: employeeTypes } = useGetEmployeeTypes()
  const { data: officeTimingWeekends } = useGetOfficeTimingWeekends()
  const { data: leaveTypes } = useGetLeaveTypes()

  const currentYear = new Date().getFullYear()
  const currentYearLeaveTypes = leaveTypes?.data?.filter(
    (item) => item.yearPeriod === currentYear
  )

  const [error, setError] = useState<string | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false)

  const [employeePhotoFile, setEmployeePhotoFile] = useState<File | null>(null)
  const [cvUrl, setCvFile] = useState<File | null>(null)

  const [formData, setFormData] = useState<
    Omit<
      CreateEmployeeType,
      'employeeId' | 'createdAt' | 'updatedAt' | 'updatedBy'
    >
  >({
    empFullName: '',
    workEmail: '',
    officialPhone: '',
    personalPhone: null,
    presentAddress: '',
    permanentAddress: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    photoUrl: null,
    cvUrl: null,
    dob: '',
    doj: new Date().toISOString().split('T')[0],
    gender: 'Male',
    bloodGroup: null,
    basicSalary: 0,
    isActive: 1,
    empCode: '',
    departmentId: 0,
    designationId: 0,
    employeeTypeId: 0,
    leaveTypeIds: [],
    officeTimingId: 0,
    createdBy: userData?.userId || 0,
  })

  // ── Input handlers ──────────────────────────────────────────────────────────
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : null }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value || null }))
    }
  }

  const handleEmployeePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (file) setEmployeePhotoFile(file)
  }

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file for CV')
        return
      }
      setCvFile(file)
      setError(null)
    }
  }

  const handleLeaveTypeToggle = (leaveTypeId: number) => {
    setFormData((prev) => ({
      ...prev,
      leaveTypeIds: prev.leaveTypeIds.includes(leaveTypeId)
        ? prev.leaveTypeIds.filter((id) => id !== leaveTypeId)
        : [...prev.leaveTypeIds, leaveTypeId],
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'gender' || name === 'bloodGroup') {
      setFormData((prev) => ({ ...prev, [name]: value || null }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : null }))
    }
  }

  // ── Reset / close ───────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      empFullName: '',
      workEmail: '',
      officialPhone: '',
      personalPhone: null,
      presentAddress: '',
      permanentAddress: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      photoUrl: null,
      cvUrl: null,
      dob: '',
      doj: new Date().toISOString().split('T')[0],
      gender: 'Male',
      bloodGroup: null,
      basicSalary: 0,
      isActive: 1,
      empCode: '',
      departmentId: 0,
      designationId: 0,
      employeeTypeId: 0,
      leaveTypeIds: [],
      officeTimingId: 0,
      createdBy: userData?.userId || 0,
    })
    setEmployeePhotoFile(null)
    setCvFile(null)
    setIsPopupOpen(false)
    setError(null)
    router.push('/dashboard/employee-management/employees')
  }

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    router.push('/dashboard/employee-management/employees')
  }, [router])

  const addMutation = useAddEmployee({ onClose: closePopup, reset: resetForm })

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.empFullName.trim()) return setError('Please enter full name')
    if (!formData.officialPhone.trim())
      return setError('Please enter official phone')
    if (!formData.presentAddress.trim())
      return setError('Please enter present address')
    if (!formData.dob.trim()) return setError('Please enter date of birth')
    if (!formData.doj.trim()) return setError('Please enter date of joining')
    if (!formData.empCode.trim()) return setError('Please enter employee code')
    if (!formData.basicSalary || formData.basicSalary <= 0)
      return setError('Please enter valid basic salary')
    if (!formData.departmentId || formData.departmentId <= 0)
      return setError('Please select department')
    if (!formData.designationId || formData.designationId <= 0)
      return setError('Please select designation')
    if (!formData.employeeTypeId || formData.employeeTypeId <= 0)
      return setError('Please select employee type')

    const form = new FormData()
    form.append(
      'employeeDetails',
      JSON.stringify({
        ...formData,
        photoUrl: null,
        cvUrl: null,
        createdBy: userData?.userId || 0,
      })
    )
    if (employeePhotoFile) form.append('photoUrl', employeePhotoFile)
    if (cvUrl) form.append('cvUrl', cvUrl)

    try {
      await addMutation.mutateAsync(form as any)
      toast({
        title: 'Success!',
        description: 'Employee is added successfully.',
      })
    } catch (err) {
      setError('Failed to create employee')
      console.error('Error creating employee:', err)
    }
  }

  // ── Download Template (ExcelJS — mirrors create-student pattern) ────────────
  const handleDownloadTemplate = async () => {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()

    // ── 1. Build lookup lists ─────────────────────────────────────────────────
    const allLeaves = currentYearLeaveTypes ?? []

    const departmentLabels = (departments?.data ?? []).map(
      (d) => `${d.departmentName} | ${d.departmentId}`
    )
    const designationLabels = (designations?.data ?? []).map(
      (d) => `${d.designationName} | ${d.designationId}`
    )
    const employeeTypeLabels = (employeeTypes?.data ?? []).map(
      (t) => `${t.employeeTypeName} | ${t.employeeTypeId}`
    )
    const officeTimingLabels = (officeTimingWeekends?.data ?? []).map(
      (t) =>
        `${formatTime(t.startTime)} - ${formatTime(t.endTime)}${
          t.weekends?.length ? ` (Off: ${t.weekends.join(', ')})` : ''
        } | ${t.officeTimingId}`
    )
    const genderLabels = ['Male', 'Female']
    const bloodGroupLabels = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']

    // ── 2. Main sheet FIRST — SheetJS (used by ExcelFileInput) reads sheet[0] ──
    // Lookup must come AFTER so the xlsx parser sees "Create Employees" first.
    const sheet = workbook.addWorksheet('Create Employees')

    sheet.columns = STATIC_COLUMNS.map(({ header, key, width }) => ({
      header,
      key,
      width,
    }))

    // Dynamic leave-type columns (one per leave type)
    // Header format: "Leave Type Name | Year (leaveTypeId)"
    allLeaves.forEach((leave, idx) => {
      const colHeader = `${leave.leaveTypeName} | ${leave.yearPeriod} (${leave.leaveTypeId})`
      const colIdx = STATIC_COLUMNS.length + 1 + idx
      sheet.getColumn(colIdx).width = 38
      sheet.getColumn(colIdx).header = colHeader
    })

    // ── 4. Style header row ───────────────────────────────────────────────────
    const headerRow = sheet.getRow(1)

    STATIC_COLUMNS.forEach(({ header, required }, idx) => {
      const cell = headerRow.getCell(idx + 1)
      cell.value = required
        ? {
            richText: [
              {
                text: header,
                font: { bold: true, color: { argb: 'FF000000' } },
              },
              { text: ' *', font: { bold: true, color: { argb: 'FFDC2626' } } },
            ],
          }
        : {
            richText: [
              {
                text: header,
                font: { bold: true, color: { argb: 'FF000000' } },
              },
            ],
          }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFBBF24' },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })

    allLeaves.forEach((leave, idx) => {
      const colHeader = `${leave.leaveTypeName} | ${leave.yearPeriod} (${leave.leaveTypeId})`
      const colIdx = STATIC_COLUMNS.length + 1 + idx
      const cell = headerRow.getCell(colIdx)
      cell.value = {
        richText: [
          {
            text: colHeader,
            font: { bold: true, color: { argb: 'FF000000' } },
          },
        ],
      }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1FAE5' },
      } // light green for leave columns
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

    headerRow.height = 36

    // ── 5. Hint row (row 2) ───────────────────────────────────────────────────
    const hintRow = sheet.getRow(2)

    STATIC_COLUMNS.forEach((_, idx) => {
      const cell = hintRow.getCell(idx + 1)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF9C3' },
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })

    allLeaves.forEach((leave, idx) => {
      const colIdx = STATIC_COLUMNS.length + 1 + idx
      const cell = hintRow.getCell(colIdx)
      cell.value = `Yes = include  |  blank = skip  (${leave.totalLeaves} days)`
      cell.font = { italic: true, size: 8, color: { argb: 'FF6B7280' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0FDF4' },
      }
      cell.alignment = { horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }

      // Yes/No dropdown validation on data rows
      for (let row = 3; row <= 201; row++) {
        sheet.getCell(row, colIdx).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"Yes,No"'],
        }
      }
    })

    hintRow.height = 14

    // ── 6. Per-row dropdowns (data rows start at 3) ───────────────────────────
    for (let row = 3; row <= 201; row++) {
      // P: Department
      sheet.getCell(`P${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Department',
        error: 'Please select a department from the dropdown.',
        formulae: ['DepartmentList'],
      }
      // Q: Designation
      sheet.getCell(`Q${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Designation',
        error: 'Please select a designation from the dropdown.',
        formulae: ['DesignationList'],
      }
      // R: Employee Type
      sheet.getCell(`R${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Employee Type',
        error: 'Please select an employee type from the dropdown.',
        formulae: ['EmployeeTypeList'],
      }
      // S: Office Timing
      sheet.getCell(`S${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['OfficeTimingList'],
      }
      // K: Gender
      sheet.getCell(`K${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Gender',
        error: 'Please select Male or Female.',
        formulae: ['GenderList'],
      }
      // L: Blood Group
      sheet.getCell(`L${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Blood Group',
        error: 'Please select a valid blood group.',
        formulae: ['BloodGroupList'],
      }
    }

    // ── 7. Freeze top 2 rows + col A ─────────────────────────────────────────
    // ── 7. Hidden Lookup sheet — created AFTER main sheet so SheetJS reads
    // sheet index 0 ("Create Employees") and not this one when importing.
    const lookupSheet = workbook.addWorksheet('Lookup')
    lookupSheet.state = 'veryHidden'

    // Col A — departments
    departmentLabels.forEach((label, i) => {
      lookupSheet.getCell(`A${i + 1}`).value = label
    })
    if (departmentLabels.length > 0)
      workbook.definedNames.add(
        `Lookup!$A$1:$A$${departmentLabels.length}`,
        'DepartmentList'
      )

    // Col B — designations
    designationLabels.forEach((label, i) => {
      lookupSheet.getCell(`B${i + 1}`).value = label
    })
    if (designationLabels.length > 0)
      workbook.definedNames.add(
        `Lookup!$B$1:$B$${designationLabels.length}`,
        'DesignationList'
      )

    // Col C — employee types
    employeeTypeLabels.forEach((label, i) => {
      lookupSheet.getCell(`C${i + 1}`).value = label
    })
    if (employeeTypeLabels.length > 0)
      workbook.definedNames.add(
        `Lookup!$C$1:$C$${employeeTypeLabels.length}`,
        'EmployeeTypeList'
      )

    // Col D — office timings
    officeTimingLabels.forEach((label, i) => {
      lookupSheet.getCell(`D${i + 1}`).value = label
    })
    if (officeTimingLabels.length > 0)
      workbook.definedNames.add(
        `Lookup!$D$1:$D$${officeTimingLabels.length}`,
        'OfficeTimingList'
      )

    // Col E — genders
    genderLabels.forEach((g, i) => {
      lookupSheet.getCell(`E${i + 1}`).value = g
    })
    workbook.definedNames.add('Lookup!$E$1:$E$2', 'GenderList')

    // Col F — blood groups
    bloodGroupLabels.forEach((bg, i) => {
      lookupSheet.getCell(`F${i + 1}`).value = bg
    })
    workbook.definedNames.add('Lookup!$F$1:$F$8', 'BloodGroupList')

    // ── 8. Freeze top 2 rows + col A
    sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 2 }]

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, 'create-employees-template.xlsx')
  }

  // ── Parse & submit Excel data ───────────────────────────────────────────────
  const handleExcelDataParsed = (data: any[]) => {
    console.log('Excel data parsed:', data)
  }

  const handleExcelSubmit = async (data: any[]) => {
    try {
      const allLeaves = currentYearLeaveTypes ?? []

      // Strip trailing " *" from richText-concatenated headers
      const normalizeKey = (k: string) => k.trim().replace(/\s*\*$/, '')

      // Filter out hint row and empty rows
      const validRows = data.filter((row) => {
        const keys = Object.keys(row).filter((k) => k !== '__EMPTY')
        if (keys.length === 0) return false

        const allHint = keys.every((k) =>
          String(row[k] ?? '')
            .trim()
            .startsWith('Yes = include')
        )
        if (allHint) return false

        // Must have a non-empty Full Name or Employee Code
        const nameKey = keys.find((k) => normalizeKey(k) === 'Full Name')
        const codeKey = keys.find((k) => normalizeKey(k) === 'Employee Code')
        return (
          (nameKey && String(row[nameKey] ?? '').trim()) ||
          (codeKey && String(row[codeKey] ?? '').trim())
        )
      })

      const employeesToCreate = validRows.map((row) => {
        const keys = Object.keys(row).filter((k) => k !== '__EMPTY')

        const get = (colHeader: string) => {
          const key = keys.find((k) => normalizeKey(k) === colHeader.trim())
          return key ? row[key] : undefined
        }

        // ── Parse Department label: "Name | id" ──────────────────────────────
        const deptLabel = String(get('Department') ?? '')
        const deptParts = deptLabel.split(' | ')
        const departmentId =
          deptParts.length >= 2 ? Number(deptParts[deptParts.length - 1]) : null

        // ── Parse Designation label ───────────────────────────────────────────
        const desigLabel = String(get('Designation') ?? '')
        const desigParts = desigLabel.split(' | ')
        const designationId =
          desigParts.length >= 2
            ? Number(desigParts[desigParts.length - 1])
            : null

        // ── Parse Employee Type label ─────────────────────────────────────────
        const etLabel = String(get('Employee Type') ?? '')
        const etParts = etLabel.split(' | ')
        const employeeTypeId =
          etParts.length >= 2 ? Number(etParts[etParts.length - 1]) : null

        // ── Parse Office Timing label ─────────────────────────────────────────
        // Format: "HH:MM - HH:MM (Off: ...) | officeTimingId"
        const otLabel = String(get('Office Timing') ?? '')
        const otParts = otLabel.split(' | ')
        const officeTimingId =
          otParts.length >= 2 ? Number(otParts[otParts.length - 1]) : null

        // ── Collect selected leave types from per-leave columns ───────────────
        // Column header format: "Leave Type Name | Year (leaveTypeId)"
        const leaveTypeIds: number[] = []

        for (const leave of allLeaves) {
          const colHeader = `${leave.leaveTypeName} | ${leave.yearPeriod} (${leave.leaveTypeId})`
          const matchedKey = keys.find(
            (k) => normalizeKey(k) === colHeader.trim()
          )

          if (matchedKey) {
            const cellValue = String(row[matchedKey] ?? '')
              .trim()
              .toLowerCase()
            if (['yes', 'y', '1', 'true'].includes(cellValue)) {
              leaveTypeIds.push(leave.leaveTypeId!)
            }
          }
        }

        // ── Normalize dates ───────────────────────────────────────────────────
        const normalizeDate = (raw: any): string => {
          if (!raw) return ''
          const s = String(raw)
          if (s.includes('-')) return s
          const d = new Date(s)
          return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : s
        }

        return {
          empFullName: String(get('Full Name') ?? ''),
          workEmail: String(get('workEmail') ?? ''),
          officialPhone: String(get('Official Phone') ?? ''),
          personalPhone: get('Personal Phone')
            ? String(get('Personal Phone'))
            : null,
          presentAddress: String(get('Present Address') ?? ''),
          permanentAddress: get('Permanent Address')
            ? String(get('Permanent Address'))
            : null,
          emergencyContactName: get('Emergency Contact Name')
            ? String(get('Emergency Contact Name'))
            : null,
          emergencyContactPhone: get('Emergency Contact Phone')
            ? String(get('Emergency Contact Phone'))
            : null,
          photoUrl: null,
          cvUrl: null,
          dob: normalizeDate(get('Date of Birth')),
          doj:
            normalizeDate(get('Date of Joining')) ||
            new Date().toISOString().split('T')[0],
          gender: String(get('Gender') ?? 'Male'),
          bloodGroup: get('Blood Group') ? String(get('Blood Group')) : null,
          basicSalary: get('Basic Salary') ? Number(get('Basic Salary')) : 0,
          grossSalary: get('Gross Salary') ? Number(get('Gross Salary')) : 0,
          isActive: 1,
          empCode: String(get('Employee Code') ?? ''),
          departmentId: departmentId && !isNaN(departmentId) ? departmentId : 0,
          designationId:
            designationId && !isNaN(designationId) ? designationId : 0,
          employeeTypeId:
            employeeTypeId && !isNaN(employeeTypeId) ? employeeTypeId : 0,
          officeTimingId:
            officeTimingId && !isNaN(officeTimingId) ? officeTimingId : null,
          leaveTypeIds,
          createdBy: userData?.userId || 0,
        }
      })

      console.log('Employees to create from Excel:', employeesToCreate)

      for (const employee of employeesToCreate) {
        const form = new FormData()
        form.append('employeeDetails', JSON.stringify(employee))
        await addMutation.mutateAsync(form as any)
      }

      setIsImportPopupOpen(false)
      toast({
        title: 'Success!',
        description: `${employeesToCreate.length} employees added successfully.`,
      })
      resetForm()
    } catch (error) {
      console.error('Error importing employees:', error)
      toast({
        title: 'Error',
        description:
          'Failed to import employees. Please check the data and try again.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    if (addMutation.error) {
      setError('Error creating employee')
      console.error('Mutation error:', addMutation.error)
    }
  }, [addMutation.error])

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <User className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Create Employee</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={handleDownloadTemplate}
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => setIsImportPopupOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        {/* Personal Information */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Personal Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="empFullName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="empFullName"
                name="empFullName"
                type="text"
                value={formData.empFullName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeePhoto" className="text-sm">
                Employee Photo
              </Label>
              <Input
                id="employeePhoto"
                type="file"
                accept="image/*"
                onChange={handleEmployeePhotoChange}
                className="text-sm"
              />
              {employeePhotoFile && (
                <p className="text-xs text-green-600">
                  ✓ Photo selected: {employeePhotoFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Address</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="presentAddress">
                Present Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="presentAddress"
                name="presentAddress"
                type="text"
                value={formData.presentAddress}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permanentAddress">Permanent Address</Label>
              <Input
                id="permanentAddress"
                name="permanentAddress"
                type="text"
                value={formData.permanentAddress || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Physical Details */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Physical Details</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gender">
                Gender <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleSelectChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Select
                value={formData.bloodGroup || ''}
                onValueChange={(value) =>
                  handleSelectChange('bloodGroup', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Emergency Contact</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">
                Emergency Contact Name
              </Label>
              <Input
                id="emergencyContactName"
                name="emergencyContactName"
                type="text"
                value={formData.emergencyContactName || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">
                Emergency Contact Phone
              </Label>
              <Input
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContactPhone || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Contact Info</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="workEmail">workEmail</Label>
              <Input
                id="workEmail"
                name="workEmail"
                type="email"
                value={formData.workEmail}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="officialPhone">
                Official Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="officialPhone"
                name="officialPhone"
                type="tel"
                value={formData.officialPhone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personalPhone">Personal Phone</Label>
              <Input
                id="personalPhone"
                name="personalPhone"
                type="tel"
                value={formData.personalPhone || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Official Details */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">Official</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="empCode">
                Employee Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="empCode"
                name="empCode"
                type="text"
                value={formData.empCode}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentId">
                Department <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  departments?.data?.map((dept) => ({
                    id: dept?.departmentId?.toString() || '0',
                    name: dept.departmentName || 'Unnamed department',
                  })) || []
                }
                value={
                  formData.departmentId
                    ? {
                        id: formData.departmentId.toString(),
                        name:
                          departments?.data?.find(
                            (d) => d.departmentId === formData.departmentId
                          )?.departmentName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'departmentId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select department"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designationId">
                Designation <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  designations?.data?.map((desig) => ({
                    id: desig?.designationId?.toString() || '0',
                    name: desig.designationName || 'Unnamed designation',
                  })) || []
                }
                value={
                  formData.designationId
                    ? {
                        id: formData.designationId.toString(),
                        name:
                          designations?.data?.find(
                            (d) => d.designationId === formData.designationId
                          )?.designationName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'designationId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select designation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeTypeId">
                Employee Type <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  employeeTypes?.data?.map((type) => ({
                    id: type?.employeeTypeId?.toString() || '0',
                    name: type.employeeTypeName || 'Unnamed type',
                  })) || []
                }
                value={
                  formData.employeeTypeId
                    ? {
                        id: formData.employeeTypeId.toString(),
                        name:
                          employeeTypes?.data?.find(
                            (t) => t.employeeTypeId === formData.employeeTypeId
                          )?.employeeTypeName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'employeeTypeId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select employee type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doj">
                Date of Joining <span className="text-red-500">*</span>
              </Label>
              <Input
                id="doj"
                name="doj"
                type="date"
                value={formData.doj}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="officeTimingId">
                Office Timing <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  officeTimingWeekends?.data?.map((timing) => ({
                    id: timing.officeTimingId?.toString() || '0',
                    name: `${formatTime(timing.startTime)} - ${formatTime(timing.endTime)}${timing.weekends?.length ? ` (Off: ${timing.weekends.join(', ')})` : ''}`,
                  })) || []
                }
                value={
                  formData.officeTimingId
                    ? {
                        id: formData.officeTimingId.toString(),
                        name: (() => {
                          const t = officeTimingWeekends?.data?.find(
                            (t) => t.officeTimingId === formData.officeTimingId
                          )
                          return t
                            ? `${formatTime(t.startTime)} - ${formatTime(t.endTime)}${t.weekends?.length ? ` (Off: ${t.weekends.join(', ')})` : ''}`
                            : ''
                        })(),
                      }
                    : null
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    officeTimingId: value ? Number(value.id) : 0,
                  }))
                }
                placeholder="Select office timing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basicSalary">
                Basic Salary <span className="text-red-500">*</span>
              </Label>
              <Input
                id="basicSalary"
                name="basicSalary"
                type="number"
                step="0.01"
                value={formData.basicSalary || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvUrl" className="text-sm">
                Upload CV (PDF only)
              </Label>
              <Input
                id="cvUrl"
                type="file"
                accept="application/pdf"
                onChange={handleCvChange}
                className="text-sm"
              />
              {cvUrl && (
                <p className="text-xs text-green-600">
                  ✓ CV selected: {cvUrl.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Leave Types */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">
            Leave Types ({currentYear})
          </h3>
          <div className="space-y-3">
            <Label>Select Leave Types</Label>
            <div className="grid gap-3 md:grid-cols-3">
              {currentYearLeaveTypes?.map((leave) => (
                <div
                  key={leave.leaveTypeId}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`leave-${leave.leaveTypeId}`}
                    checked={
                      leave.leaveTypeId !== undefined &&
                      formData.leaveTypeIds.includes(leave.leaveTypeId)
                    }
                    onCheckedChange={() =>
                      leave.leaveTypeId !== undefined &&
                      handleLeaveTypeToggle(leave.leaveTypeId)
                    }
                    className="bg-white"
                  />
                  <label
                    htmlFor={`leave-${leave.leaveTypeId}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {leave.leaveTypeName}
                    <span className="text-gray-500 ml-1">
                      ({leave.totalLeaves} days)
                    </span>
                  </label>
                </div>
              ))}
            </div>
            {formData.leaveTypeIds.length > 0 && (
              <p className="text-xs text-green-600">
                ✓ {formData.leaveTypeIds.length} leave type(s) selected
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={resetForm}>
            Reset Fields
          </Button>
          <Button type="submit" disabled={addMutation.isPending}>
            {addMutation.isPending ? 'Creating...' : 'Create Employee'}
          </Button>
        </div>
      </form>

      {/* Bulk Import Popup */}
      <Popup
        isOpen={isImportPopupOpen}
        onClose={() => setIsImportPopupOpen(false)}
        title="Import Employees from Excel"
        size="sm:max-w-3xl"
      >
        <div className="py-4">
          <div className="mb-4 p-4 bg-amber-50 rounded-md text-sm text-gray-700 space-y-1">
            <p className="font-semibold">How to use:</p>
            <p>
              1. Click <strong>Download Template</strong> to get the Excel file
              with dropdowns pre-filled from your data.
            </p>
            <p>
              2. Select <strong>Department</strong>,{' '}
              <strong>Designation</strong>, <strong>Employee Type</strong>, and{' '}
              <strong>Office Timing</strong> from the built-in dropdowns — IDs
              are extracted automatically on import.
            </p>
            <p>
              3. For <strong>Leave Types</strong>, each leave type has its own
              column (shown in green). Type <strong>Yes</strong> (or select from
              dropdown) in any leave type column to assign it to the employee.
              Leave blank to skip.
            </p>
            <p>
              4. Fields marked with a red{' '}
              <span className="text-red-500 font-bold">*</span> in the template
              are required.
            </p>
            <p className="text-xs text-gray-500 pt-1">
              Only leave types for <strong>{currentYear}</strong> are shown.
              Leave type columns display the total days allowed.
            </p>
          </div>
          <ExcelFileInput
            onDataParsed={handleExcelDataParsed}
            onSubmit={handleExcelSubmit}
            submitButtonText="Import Employees"
            dateColumns={['Date of Birth', 'Date of Joining']}
          />
        </div>
      </Popup>
    </div>
  )
}

export default CreateEmployee
