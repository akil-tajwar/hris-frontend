'use client'

import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { User, Upload, Download } from 'lucide-react'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter, useSearchParams } from 'next/navigation'
import { CustomCombobox } from '@/utils/custom-combobox'
import {
  useAddEmployee,
  useGetDepartments,
  useGetDesignations,
  useGetEmploymentTypes,
  useGetCompanies,
  useGetWorkStations,
  useGetDivisions,
  useGetCostCenters,
  useGetAllEmployees,
  useGetRoles,
  useGetEmployeePreboardingById,
  useGetLeavePolicies,
  useGetSalaryStructures,
  useGetAttendancePolicies,
} from '@/hooks/use-api'
import { toast } from '@/hooks/use-toast'
import ExcelFileInput from '@/utils/excel-file-input'
import { Popup } from '@/utils/popup'
import { saveAs } from 'file-saver'
import { GetLeavePolicyType, GetSalaryStructureType } from '@/utils/type'

// ── Static column definitions ─────────────────────────────────────────────────
const STATIC_COLUMNS = [
  { header: 'Full Name', key: 'empFullName', width: 24, required: true },
  { header: 'workEmail', key: 'workEmail', width: 28, required: false },
  { header: 'Official Phone', key: 'officialPhone', width: 18, required: true },
  {
    header: 'Personal Phone',
    key: 'personalPhone',
    width: 18,
    required: false,
  },
  {
    header: 'Present Address',
    key: 'presentAddress',
    width: 30,
    required: true,
  },
  {
    header: 'Permanent Address',
    key: 'permanentAddress',
    width: 30,
    required: false,
  },
  {
    header: 'Emergency Contact Name',
    key: 'emergencyContactName',
    width: 24,
    required: false,
  },
  {
    header: 'Emergency Contact Phone',
    key: 'emergencyContactPhone',
    width: 22,
    required: false,
  },
  { header: 'Date of Birth', key: 'dob', width: 14, required: true },
  { header: 'Date of Joining', key: 'doj', width: 14, required: true },
  { header: 'Gender', key: 'gender', width: 10, required: true },
  { header: 'Blood Group', key: 'bloodGroup', width: 12, required: false },
  { header: 'Basic Salary', key: 'basicSalary', width: 14, required: false },
  { header: 'Gross Salary', key: 'grossSalary', width: 14, required: true },
  { header: 'Employee Code', key: 'empCode', width: 16, required: true },
  { header: 'Department', key: 'departmentId', width: 30, required: true },
  { header: 'Designation', key: 'designationId', width: 30, required: true },
  {
    header: 'Employment Type',
    key: 'employmentTypeId',
    width: 24,
    required: true,
  },
]

// ── Local form types ──────────────────────────────────────────────────────────
type EmployeeFormData = {
  empFullName: string
  empShortName: string | null
  dob: string
  gender: 'Male' | 'Female'
  nationality:
    | 'Bangladeshi'
    | 'Pakistani'
    | 'Indian'
    | 'British'
    | 'American'
    | null
  nationalIdNo: string | null
  maritalStatus: 'Single' | 'Married' | null
  religion: string | null
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null
  photoUrl: string | null
  cvUrl: string | null
  certificateUrl: string | null
  workEmail: string | null
  privateEmail: string | null
  homePhone: string | null
  personalPhone: string | null
  officialPhone: string
  presentAddress: string
  permanentAddress: string | null
  country: string | null
  city: string | null
  zipCode: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  emergencyContactRelation: string | null
  qualification: 'SSC' | 'HSC' | 'Graduate' | 'Postgraduate'
  instituteName: string | null
  subjectName: string | null
  startDate: string | null
  endDate: string | null
  result: string | null
  dependentsName: string | null
  dependentRelation: string | null
  empCode: string
  doj: string
  doc: string | null
  basicSalary: number
  isActive: boolean
  departmentId: number
  designationId: number
  employmentTypeId: number
  probationMonths: number
  companyId: number
  divisionId: number
  reportingAuthorityId: number | null
  leavePolicyMasterId: number | null
  salaryStructureMasterId: number | null
  attendancePolicyId: number | null
  createdBy: number
}

type UserFormData = {
  username: string
  password: string
  confirmPassword: string
  email: string
  roleId: number
  tenantId: number
  active: boolean
}

// ── Multi-select checklist ────────────────────────────────────────────────────
type MultiSelectItem = { id: number; name: string }

const defaultDob = new Date()
defaultDob.setFullYear(defaultDob.getFullYear() - 25)

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0]
}

// ── Empty form default ────────────────────────────────────────────────────────
const buildEmptyForm = (userId: number): EmployeeFormData => ({
  empFullName: '',
  empShortName: null,
  dob: formatDate(defaultDob),
  gender: 'Male',
  nationality: null,
  nationalIdNo: null,
  maritalStatus: null,
  religion: null,
  bloodGroup: null,
  photoUrl: null,
  cvUrl: null,
  certificateUrl: null,
  workEmail: '',
  privateEmail: null,
  homePhone: null,
  personalPhone: null,
  officialPhone: '',
  presentAddress: '',
  permanentAddress: null,
  country: null,
  city: null,
  zipCode: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
  emergencyContactRelation: null,
  qualification: 'Graduate',
  instituteName: null,
  subjectName: null,
  startDate: null,
  endDate: null,
  result: null,
  dependentsName: null,
  dependentRelation: null,
  empCode: '',
  doj: new Date().toISOString().split('T')[0],
  doc: null,
  basicSalary: 0,
  isActive: true,
  departmentId: 0,
  designationId: 0,
  employmentTypeId: 0,
  probationMonths: 0,
  companyId: 0,
  divisionId: 0,
  reportingAuthorityId: null,
  leavePolicyMasterId: null,
  salaryStructureMasterId: null,
  attendancePolicyId: null,
  createdBy: userId,
})

const CreateEmployee = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const router = useRouter()

  const searchParams = useSearchParams()
  const preboardingId = searchParams.get('preboardingId')

  const { data: preboarding } = useGetEmployeePreboardingById(
    Number(preboardingId)
  )
  console.log('🚀 ~ CreateEmployee ~ preboarding:', preboarding)

  const { data: departments } = useGetDepartments()
  const { data: designations } = useGetDesignations()
  const { data: employmentTypes } = useGetEmploymentTypes()
  const { data: companies } = useGetCompanies()
  const { data: workStations } = useGetWorkStations()
  const { data: divisions } = useGetDivisions()
  const { data: costCenters } = useGetCostCenters()
  const { data: employees } = useGetAllEmployees()
  const { data: roles } = useGetRoles()
  const { data: attendancePolicies } = useGetAttendancePolicies()
  const { data: leavePoliciesResponse } = useGetLeavePolicies()
  const { data: salaryStructuresResponse } = useGetSalaryStructures()

  const [error, setError] = useState<string | null>(null)
  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false)

  const [employeePhotoFile, setEmployeePhotoFile] = useState<File | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)

  const [formData, setFormData] = useState<EmployeeFormData>(() =>
    buildEmptyForm(userData?.userId || 0)
  )

  const [userFormData, setUserFormData] = useState<UserFormData>({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    roleId: 0,
    tenantId: 0,
    active: true,
  })

  // ── Sync createdBy when userData loads ───────────────────────────────────
  useEffect(() => {
    if (userData?.userId) {
      setFormData((prev) => ({ ...prev, createdBy: userData.userId }))
      setUserFormData((prev) => ({ ...prev, tenantId: userData.tenantId ?? 0 }))
    }
  }, [userData?.userId, userData?.tenantId])

  // ── Pre-fill from preboarding ─────────────────────────────────────────────
  useEffect(() => {
    if (!preboarding) return

    setFormData((prev) => ({
      ...prev,
      empFullName: preboarding.data?.fullName ?? prev.empFullName,
      gender: (preboarding.data?.gender as 'Male' | 'Female') ?? prev.gender,
      dob: preboarding.data?.dob
        ? new Date(preboarding.data.dob).toISOString().split('T')[0]
        : '',
      workEmail: preboarding.data?.personalEmail ?? prev.workEmail,
      personalPhone: preboarding.data?.personalPhone ?? prev.personalPhone,
      doj: preboarding.data?.tentativeJoiningDate
        ? new Date(preboarding.data.tentativeJoiningDate)
            .toISOString()
            .split('T')[0]
        : prev.doj,
      companyId: preboarding.data?.companyId ?? prev.companyId,
      departmentId: preboarding.data?.departmentId ?? prev.departmentId,
      designationId: preboarding.data?.designationId ?? prev.designationId,
      reportingAuthorityId:
        preboarding.data?.reportingAuthorityId ?? prev.reportingAuthorityId,
      employmentTypeId:
        preboarding.data?.employmentTypeId ?? prev.employmentTypeId,
      probationMonths:
        preboarding.data?.probationMonths ?? prev.probationMonths,
      salaryStructureMasterId:
        preboarding.data?.salaryStructureMasterId ??
        prev.salaryStructureMasterId,
      basicSalary: preboarding.data?.offeredSalary ?? prev.basicSalary,
    }))
  }, [preboarding])

  // ── Derive checklist items from typed API responses ───────────────────────
  const leavePolicyItems: MultiSelectItem[] = (
    (leavePoliciesResponse?.data ?? []) as GetLeavePolicyType[]
  )
    .filter((p) => p.leavePolicyMaster.leavePolicyMasterId != null)
    .map((p) => ({
      id: p.leavePolicyMaster.leavePolicyMasterId as number,
      name: p.leavePolicyMaster.policyName,
    }))

  const salaryStructureItems: MultiSelectItem[] = (
    (salaryStructuresResponse?.data ?? []) as GetSalaryStructureType[]
  )
    .filter((s) => s.salaryStructureMaster.salaryStructureMasterId != null)
    .map((s) => ({
      id: s.salaryStructureMaster.salaryStructureMasterId as number,
      name: s.salaryStructureMaster.structureName,
    }))

  // ── Input handlers ────────────────────────────────────────────────────────
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement
    if (name === 'officialPhone' || name === 'personalPhone') {
       const phone = value.replace(/[^0-9+-]/g, '')

      setFormData((prev) => ({
        ...prev,
        [name]: phone === '' ? null : phone,
      }))
      return
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : null }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? null : value }))
    }
  }

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserFormData((prev) => ({ ...prev, [name]: value === '' ? '' : value }))
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

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCertificateFile(file)
      setError(null)
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    const stringFields = [
      'gender',
      'bloodGroup',
      'nationality',
      'maritalStatus',
      'qualification',
    ]
    if (stringFields.includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: value || null }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : null }))
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData(buildEmptyForm(userData?.userId || 0))
    setUserFormData({
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      roleId: 0,
      tenantId: 0,
      active: true,
    })
    setEmployeePhotoFile(null)
    setCvFile(null)
    setCertificateFile(null)
    setError(null)
    router.push('/dashboard/employee-management/employees')
  }

  const closePopup = useCallback(() => {
    setError(null)
    router.push('/dashboard/employee-management/employees')
  }, [router])

  const addMutation = useAddEmployee({ onClose: closePopup, reset: resetForm })
  console.log('🚀 ~ CreateEmployee ~ addMutation:', addMutation)

  const userCompanyOptions = useMemo(
    () =>
      (companies?.data ?? [])
        .filter((c) => (c as any).tenantId === userData?.tenantId)
        .map((c) => ({
          value: String((c as any).companyId),
          label: (c as any).companyName || 'Unnamed company',
        })),
    [companies, userData?.tenantId]
  )

  // ── Submit ────────────────────────────────────────────────────────────────
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
    if (!formData.employmentTypeId || formData.employmentTypeId <= 0)
      return setError('Please select employee type')
    if (!formData.companyId || formData.companyId <= 0)
      return setError('Please select company')
    if (!formData.divisionId || formData.divisionId <= 0)
      return setError('Please select division')
    if (!userFormData.username.trim()) return setError('Please enter username')
    if (!userFormData.email.trim()) return setError('Please enter user email')
    if (!userFormData.password.trim()) return setError('Please enter password')
    if (userFormData.password.length < 6)
      return setError('Password must be at least 6 characters')
    if (userFormData.password !== userFormData.confirmPassword)
      return setError('Passwords do not match')
    if (!userFormData.roleId || userFormData.roleId <= 0)
      return setError('Please select a role')

    const form = new FormData()
    form.append(
      'employeeDetails',
      JSON.stringify({
        ...formData,
        photoUrl: null,
        cvUrl: null,
        certificateUrl: null,
        createdBy: userData?.userId || 0,
        preboardingId: preboardingId ? Number(preboardingId) : null,
      })
    )
    form.append(
      'userData',
      JSON.stringify({
        username: userFormData.username,
        password: userFormData.password,
        confirmPassword: userFormData.confirmPassword,
        active: userFormData.active,
        isPasswordResetRequired: true,
        roleId: userFormData.roleId,
        tenantId: userFormData.tenantId,
        email: userFormData.email,
      })
    )
    if (employeePhotoFile) form.append('photoUrl', employeePhotoFile)
    if (cvFile) form.append('cvUrl', cvFile)
    if (certificateFile) form.append('certificateUrl', certificateFile)

    try {
      await addMutation.mutateAsync(form as any)
      toast({
        title: 'Success!',
        description: 'Employee and user account created successfully.',
      })
    } catch (err) {
      setError('Failed to create employee')
      console.error('Error creating employee:', err)
    }
  }

  // ── Download Template ─────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()

    const departmentLabels = (departments?.data ?? []).map(
      (d) => `${d.departmentName} | ${d.departmentId}`
    )
    const designationLabels = (designations?.data ?? []).map(
      (d) => `${d.designationName} | ${d.designationId}`
    )
    const employmentTypeLabels = (employmentTypes?.data ?? []).map(
      (t) => `${t.employmentTypeName} | ${t.employmentTypeId}`
    )
    const genderLabels = ['Male', 'Female']
    const bloodGroupLabels = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']

    const sheet = workbook.addWorksheet('Create Employees')
    sheet.columns = STATIC_COLUMNS.map(({ header, key, width }) => ({
      header,
      key,
      width,
    }))

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
    headerRow.height = 36

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
    hintRow.height = 14

    for (let row = 3; row <= 201; row++) {
      sheet.getCell(`P${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Department',
        error: 'Please select a department from the dropdown.',
        formulae: ['DepartmentList'],
      }
      sheet.getCell(`Q${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Designation',
        error: 'Please select a designation from the dropdown.',
        formulae: ['DesignationList'],
      }
      sheet.getCell(`R${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Employment Type',
        error: 'Please select an employee type from the dropdown.',
        formulae: ['EmploymentTypeList'],
      }
      sheet.getCell(`S${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['ShiftList'],
      }
      sheet.getCell(`K${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Gender',
        error: 'Please select Male or Female.',
        formulae: ['GenderList'],
      }
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

    const lookupSheet = workbook.addWorksheet('Lookup')
    lookupSheet.state = 'veryHidden'

    departmentLabels.forEach((label, i) => {
      lookupSheet.getCell(`A${i + 1}`).value = label
    })
    if (departmentLabels.length > 0)
      workbook.definedNames.add(
        `Lookup!$A$1:$A$${departmentLabels.length}`,
        'DepartmentList'
      )

    designationLabels.forEach((label, i) => {
      lookupSheet.getCell(`B${i + 1}`).value = label
    })
    if (designationLabels.length > 0)
      workbook.definedNames.add(
        `Lookup!$B$1:$B$${designationLabels.length}`,
        'DesignationList'
      )

    employmentTypeLabels.forEach((label, i) => {
      lookupSheet.getCell(`C${i + 1}`).value = label
    })
    if (employmentTypeLabels.length > 0)
      workbook.definedNames.add(
        `Lookup!$C$1:$C$${employmentTypeLabels.length}`,
        'EmploymentTypeList'
      )

    genderLabels.forEach((g, i) => {
      lookupSheet.getCell(`E${i + 1}`).value = g
    })
    workbook.definedNames.add('Lookup!$E$1:$E$2', 'GenderList')

    bloodGroupLabels.forEach((bg, i) => {
      lookupSheet.getCell(`F${i + 1}`).value = bg
    })
    workbook.definedNames.add('Lookup!$F$1:$F$8', 'BloodGroupList')

    sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 2 }]

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, 'create-employees-template.xlsx')
  }

  const handleExcelDataParsed = (data: any[]) => {
    console.log('Excel data parsed:', data)
  }

  const handleExcelSubmit = async (data: any[]) => {
    try {
      const normalizeKey = (k: string) => k.trim().replace(/\s*\*$/, '')

      const validRows = data.filter((row) => {
        const keys = Object.keys(row).filter((k) => k !== '__EMPTY')
        if (keys.length === 0) return false
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
        const parseId = (label: string) => {
          const parts = String(label ?? '').split(' | ')
          return parts.length >= 2 ? Number(parts[parts.length - 1]) : null
        }
        const normalizeDate = (raw: any): string => {
          return raw ? new Date(raw).toISOString().split('T')[0] : ''
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
          isActive: true,
          empCode: String(get('Employee Code') ?? ''),
          departmentId: parseId(get('Department')) ?? 0,
          designationId: parseId(get('Designation')) ?? 0,
          employmentTypeId: parseId(get('Employment Type')) ?? 0,
          createdBy: userData?.userId || 0,
          leavePolicyMasterId: null,
          salaryStructureMasterId: null,
        }
      })

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

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <User className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Create Employee</h2>
            {preboardingId && preboarding && (
              <p className="text-xs text-blue-600 mt-0.5">
                Pre-filled from preboarding:{' '}
                <span className="font-medium">
                  {preboarding.data?.preboardNo}
                </span>
              </p>
            )}
          </div>
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
        {/* ── 1. Employee Personal Information ── */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">
            Employee Personal Information
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="empFullName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="empFullName"
                name="empFullName"
                type="text"
                value={formData.empFullName ?? ''}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="empShortName">Short Name</Label>
              <Input
                id="empShortName"
                name="empShortName"
                type="text"
                value={formData.empShortName || ''}
                onChange={handleInputChange}
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
                value={formData.dob ?? ''}
                onChange={handleInputChange}
                required
              />
            </div>

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
              <Label htmlFor="nationality">Nationality</Label>
              <Select
                value={formData.nationality || ''}
                onValueChange={(value) =>
                  handleSelectChange('nationality', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bangladeshi">Bangladeshi</SelectItem>
                  <SelectItem value="Pakistani">Pakistani</SelectItem>
                  <SelectItem value="Indian">Indian</SelectItem>
                  <SelectItem value="British">British</SelectItem>
                  <SelectItem value="American">American</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalIdNo">National ID No</Label>
              <Input
                id="nationalIdNo"
                name="nationalIdNo"
                type="text"
                value={formData.nationalIdNo || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Marital Status</Label>
              <Select
                value={formData.maritalStatus || ''}
                onValueChange={(value) =>
                  handleSelectChange('maritalStatus', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="religion">Religion</Label>
              <Input
                id="religion"
                name="religion"
                type="text"
                value={formData.religion || ''}
                onChange={handleInputChange}
              />
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

            <div className="space-y-2">
              <Label htmlFor="employeePhoto">Employee Photo</Label>
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

        {/* ── 2. Employee Official Information ── */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">
            Employee Official Information
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="empCode">
                Employee Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="empCode"
                name="empCode"
                type="text"
                value={formData.empCode ?? ''}
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
                value={formData.doj ?? ''}
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
              <Label htmlFor="employmentTypeId">
                Employment Type <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  employmentTypes?.data?.map((type) => ({
                    id: type?.employmentTypeId?.toString() || '0',
                    name: type.employmentTypeName || 'Unnamed type',
                  })) || []
                }
                value={
                  formData.employmentTypeId
                    ? {
                        id: formData.employmentTypeId.toString(),
                        name:
                          employmentTypes?.data?.find(
                            (t) =>
                              t.employmentTypeId === formData.employmentTypeId
                          )?.employmentTypeName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'employmentTypeId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select employee type"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyId">
                Company <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={(companies?.data ?? [])
                  .filter((c) => c.tenantId === userData?.tenantId)
                  .map((c) => ({
                    id: c?.companyId?.toString() || '0',
                    name: c.companyName || 'Unnamed company',
                  }))}
                value={
                  formData.companyId
                    ? {
                        id: formData.companyId.toString(),
                        name:
                          companies?.data?.find(
                            (c) => c.companyId === formData.companyId
                          )?.companyName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'companyId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select company"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="divisionId">
                Division <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  divisions?.data?.map((div) => ({
                    id: div?.divisionId?.toString() || '0',
                    name: div.divisionName || 'Unnamed division',
                  })) || []
                }
                value={
                  formData.divisionId
                    ? {
                        id: formData.divisionId.toString(),
                        name:
                          divisions?.data?.find(
                            (d) => d.divisionId === formData.divisionId
                          )?.divisionName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'divisionId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select division"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportingAuthorityId">Reporting Authority</Label>
              <CustomCombobox
                items={
                  employees?.data?.map((emp) => ({
                    id: emp?.employeeId?.toString() || '0',
                    name: emp.empFullName || 'Unnamed employee',
                  })) || []
                }
                value={
                  formData.reportingAuthorityId
                    ? {
                        id: formData.reportingAuthorityId.toString(),
                        name:
                          employees?.data?.find(
                            (e) =>
                              e.employeeId === formData.reportingAuthorityId
                          )?.empFullName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'reportingAuthorityId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select reporting authority"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="probationMonths">Probation Months</Label>
              <Input
                id="probationMonths"
                name="probationMonths"
                type="number"
                value={formData.probationMonths || ''}
                onChange={handleInputChange}
                placeholder="e.g. 3"
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
              <Label htmlFor="isActive">Status</Label>
              <Select
                value={formData.isActive ? 'true' : 'false'}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: value === 'true',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvUrl">Upload CV (PDF only)</Label>
              <Input
                id="cvUrl"
                type="file"
                accept="application/pdf"
                onChange={handleCvChange}
                className="text-sm"
              />
              {cvFile && (
                <p className="text-xs text-green-600">
                  ✓ CV selected: {cvFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 3. Employee Education Information ── */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">
            Employee Education Information
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="qualification">
                Qualification <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.qualification}
                onValueChange={(value) =>
                  handleSelectChange('qualification', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SSC">SSC</SelectItem>
                  <SelectItem value="HSC">HSC</SelectItem>
                  <SelectItem value="Graduate">Graduate</SelectItem>
                  <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instituteName">Institute Name</Label>
              <Input
                id="instituteName"
                name="instituteName"
                type="text"
                value={formData.instituteName || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjectName">Subject / Major</Label>
              <Input
                id="subjectName"
                name="subjectName"
                type="text"
                value={formData.subjectName || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="result">Result / GPA</Label>
              <Input
                id="result"
                name="result"
                type="text"
                value={formData.result || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="certificateFile">Upload Certificate</Label>
              <Input
                id="certificateFile"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleCertificateChange}
                className="text-sm"
              />
              {certificateFile && (
                <p className="text-xs text-green-600">
                  ✓ Certificate selected: {certificateFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 4. Employee Dependent Information ── */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">
            Employee Dependent Information
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dependentsName">Dependent Name</Label>
              <Input
                id="dependentsName"
                name="dependentsName"
                type="text"
                value={formData.dependentsName || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dependentRelation">Relation</Label>
              <Input
                id="dependentRelation"
                name="dependentRelation"
                type="text"
                value={formData.dependentRelation || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* ── 5. Employee Emergency Contact Information ── */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">
            Employee Emergency Contact Information
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Contact Name</Label>
              <Input
                id="emergencyContactName"
                name="emergencyContactName"
                type="text"
                value={formData.emergencyContactName || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
              <Input
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContactPhone || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactRelation">Relation</Label>
              <Input
                id="emergencyContactRelation"
                name="emergencyContactRelation"
                type="text"
                value={formData.emergencyContactRelation || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* ── 6. Contact & Address Information ── */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-4">
            Contact &amp; Address Information
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="workEmail">Work Email</Label>
              <Input
                id="workEmail"
                name="workEmail"
                type="email"
                value={formData.workEmail ?? ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="privateEmail">Private Email</Label>
              <Input
                id="privateEmail"
                name="privateEmail"
                type="email"
                value={formData.privateEmail || ''}
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
                value={formData.officialPhone ?? ''}
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
            <div className="space-y-2">
              <Label htmlFor="homePhone">Home Phone</Label>
              <Input
                id="homePhone"
                name="homePhone"
                type="tel"
                value={formData.homePhone || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="presentAddress">
                Present Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="presentAddress"
                name="presentAddress"
                type="text"
                value={formData.presentAddress ?? ''}
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
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                type="text"
                value={formData.country || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                type="text"
                value={formData.city || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                type="text"
                value={formData.zipCode || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* ── 7. Leave Policies & Salary Structures ── */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-1">
            Leave Policy, Salary Structure &amp; Attendance Policy
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Assign leave policies and salary structures that will apply to this
            employee.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="leavePolicyId">
                Leave Policy <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={leavePolicyItems.map((p) => ({
                  id: p.id.toString(),
                  name: p.name,
                }))}
                value={
                  formData.leavePolicyMasterId
                    ? {
                        id: formData.leavePolicyMasterId.toString(),
                        name:
                          leavePolicyItems.find(
                            (p) => p.id === formData.leavePolicyMasterId
                          )?.name || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'leavePolicyMasterId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select leave policy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryStructureId">
                Salary Structure <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={salaryStructureItems.map((s) => ({
                  id: s.id.toString(),
                  name: s.name,
                }))}
                value={
                  formData.salaryStructureMasterId
                    ? {
                        id: formData.salaryStructureMasterId.toString(),
                        name:
                          salaryStructureItems.find(
                            (s) => s.id === formData.salaryStructureMasterId
                          )?.name || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'salaryStructureMasterId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select salary structure"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendancePolicyId">
                Attendance Policy <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={(attendancePolicies?.data ?? []).map((p) => ({
                  id: p.id.toString(),
                  name: p.name || 'Unnamed policy',
                }))}
                value={
                  formData.attendancePolicyId
                    ? {
                        id: formData.attendancePolicyId.toString(),
                        name:
                          (attendancePolicies?.data ?? []).find(
                            (p) => p.id === formData.attendancePolicyId
                          )?.name || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'attendancePolicyId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select attendance policy"
              />
            </div>
          </div>
        </div>

        {/* ── 8. User Account Information ── */}
        <div className="border p-8 rounded-lg bg-slate-100">
          <h3 className="text-md font-semibold mb-1">
            User Account Information
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Create a system login account for this employee.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={userFormData.username}
                onChange={handleUserInputChange}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="userEmail"
                name="email"
                type="email"
                value={userFormData.email}
                onChange={handleUserInputChange}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={userFormData.password}
                onChange={handleUserInputChange}
                placeholder="Min. 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={userFormData.confirmPassword}
                onChange={handleUserInputChange}
                placeholder="Re-enter password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleId">
                Role <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  roles?.data?.map((role) => ({
                    id: role?.roleId?.toString() || '0',
                    name: role.roleName || 'Unnamed role',
                  })) || []
                }
                value={
                  userFormData.roleId
                    ? {
                        id: userFormData.roleId.toString(),
                        name:
                          roles?.data?.find(
                            (r) => r.roleId === userFormData.roleId
                          )?.roleName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  setUserFormData((prev) => ({
                    ...prev,
                    roleId: value ? Number(value.id) : 0,
                  }))
                }
                placeholder="Select role"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userActive">Account Status</Label>
              <Select
                value={userFormData.active ? 'true' : 'false'}
                onValueChange={(value) =>
                  setUserFormData((prev) => ({
                    ...prev,
                    active: value === 'true',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          <div className="mb-4 p-4 bg-blue-50 rounded-md text-sm text-gray-700 space-y-1">
            <p className="font-semibold">How to use:</p>
            <p>
              1. Click <strong>Download Template</strong> to get the Excel file
              with dropdowns pre-filled from your data.
            </p>
            <p>
              2. Select <strong>Department</strong>,{' '}
              <strong>Designation</strong>, <strong>Employment Type</strong>,
              and <strong>Shift</strong> from the built-in dropdowns — IDs are
              extracted automatically on import.
            </p>
            <p>
              3. Fields marked with a red{' '}
              <span className="text-red-500 font-bold">*</span> in the template
              are required.
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
