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
import { User } from 'lucide-react'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter, useParams } from 'next/navigation'
import { CustomCombobox } from '@/utils/custom-combobox'
import {
  useUpdateEmployeeWithFees,
  useGetDepartments,
  useGetDesignations,
  useGetEmploymentTypes,
  useGetLeaveTypes,
  useGetOfficeTimingWeekends,
  useGetEmployeeById,
  useGetCompanies,
  useGetWorkStations,
  useGetDivisions,
  useGetCostCenters,
  useGetAllEmployees,
} from '@/hooks/use-api'
import type { CreateEmployeeType } from '@/utils/type'
import { toast } from '@/hooks/use-toast'
import { formatDateForInput, formatTime } from '@/utils/conversions'

const EditEmployee = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const router = useRouter()

  const params = useParams()
  const employeeId = params.employeeId
  const { data: employee } = useGetEmployeeById(
    employeeId ? Number(employeeId) : 0
  )

  const { data: departments } = useGetDepartments()
  const { data: designations } = useGetDesignations()
  const { data: employmentTypes } = useGetEmploymentTypes()
  const { data: officeTimingWeekends } = useGetOfficeTimingWeekends()
  const { data: leaveTypes } = useGetLeaveTypes()
  const { data: companies } = useGetCompanies()
  const { data: workStations } = useGetWorkStations()
  const { data: divisions } = useGetDivisions()
  const { data: costCenters } = useGetCostCenters()
  const { data: employees } = useGetAllEmployees()

  const currentYear = new Date().getFullYear()
  const currentYearLeaveTypes = leaveTypes?.data?.filter(
    (item) => item.yearPeriod === currentYear
  )

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [employeePhotoFile, setEmployeePhotoFile] = useState<File | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [existingCvUrl, setExistingCvUrl] = useState<string | null>(null)
  const [existingCertificateUrl, setExistingCertificateUrl] = useState<
    string | null
  >(null)

  const [formData, setFormData] = useState<
    Omit<
      CreateEmployeeType,
      'employeeId' | 'createdAt' | 'updatedAt' | 'createdBy'
    >
  >({
    // Personal
    empFullName: '',
    empShortName: null,
    dob: '',
    gender: 'Male',
    nationality: null,
    nationalIdNo: null,
    maritalStatus: null,
    religion: null,
    bloodGroup: null,
    photoUrl: null,
    cvUrl: null,
    certificateUrl: null,
    // Contact
    workEmail: '',
    privateEmail: null,
    homePhone: null,
    personalPhone: null,
    officialPhone: '',

    // Address
    presentAddress: '',
    permanentAddress: null,
    country: null,
    city: null,
    zipCode: null,

    // Emergency Contact
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,

    // Education
    qualification: 'Graduate',
    instituteName: null,
    subjectName: null,
    startDate: null,
    endDate: null,
    result: null,

    // Dependent
    dependentsName: null,
    dependentRelation: null,

    // Official
    empCode: '',
    doj: new Date().toISOString().split('T')[0],
    doc: null,
    basicSalary: 0,
    isActive: true,
    departmentId: 0,
    designationId: 0,
    employmentTypeId: 0,
    officeTimingId: 0,
    companyId: 0,
    workStationId: 0,
    divisionId: 0,
    costCenterId: 0,
    reportingAuthorityId: null,
    leaveTypeIds: [],
    updatedBy: userData?.userId || 0,
  })

  // ── Load employee data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (employee?.data) {
      const emp = employee.data

      setFormData({
        empFullName: emp.empFullName || '',
        empShortName: emp.empShortName || null,
        dob: formatDateForInput(emp.dob) || '',
        gender: emp.gender || 'Male',
        nationality: emp.nationality || null,
        nationalIdNo: emp.nationalIdNo || null,
        maritalStatus: emp.maritalStatus || null,
        religion: emp.religion || null,
        bloodGroup: emp.bloodGroup || null,
        photoUrl: emp.photoUrl || null,
        cvUrl: emp.cvUrl || null,
        workEmail: emp.workEmail || '',
        privateEmail: emp.privateEmail || null,
        homePhone: emp.homePhone || null,
        personalPhone: emp.personalPhone || null,
        officialPhone: emp.officialPhone || '',
        presentAddress: emp.presentAddress || '',
        permanentAddress: emp.permanentAddress || null,
        country: emp.country || null,
        city: emp.city || null,
        zipCode: emp.zipCode || null,
        emergencyContactName: emp.emergencyContactName || null,
        emergencyContactPhone: emp.emergencyContactPhone || null,
        emergencyContactRelation: emp.emergencyContactRelation || null,
        qualification: emp.qualification || 'Graduate',
        instituteName: emp.instituteName || null,
        subjectName: emp.subjectName || null,
        startDate: formatDateForInput(emp.startDate) || null,
        endDate: formatDateForInput(emp.endDate) || null,
        result: emp.result || null,
        certificateUrl: emp.certificateUrl || null,
        dependentsName: emp.dependentsName || null,
        dependentRelation: emp.dependentRelation || null,
        empCode: emp.empCode || '',
        doj: formatDateForInput(emp.doj) || new Date().toISOString().split('T')[0],
        doc: formatDateForInput(emp.doc) || '',
        basicSalary: emp.basicSalary || 0,
        isActive: emp.isActive ?? true,
        departmentId: emp.departmentId || 0,
        designationId: emp.designationId || 0,
        employmentTypeId: emp.employmentTypeId || 0,
        officeTimingId: emp.officeTimingId || 0,
        companyId: emp.companyId || 0,
        workStationId: emp.workStationId || 0,
        divisionId: emp.divisionId || 0,
        costCenterId: emp.costCenterId || 0,
        reportingAuthorityId: emp.reportingAuthorityId || null,
        leaveTypeIds: emp.leaveTypeIds || [],
        updatedBy: userData?.userId || 0,
      })

      setExistingPhotoUrl(emp.photoUrl || null)
      setExistingCvUrl(emp.cvUrl || null)
      setExistingCertificateUrl(emp.certificateUrl || null)
      setLoading(false)
    }
  }, [employee, userData])

  // ── Input handlers ──────────────────────────────────────────────────────────
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : null }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? null : value }))
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

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCertificateFile(file)
      setError(null)
    }
  }

  const handleLeaveTypeToggle = (leaveTypeId: number) => {
    setFormData((prev) => ({
      ...prev,
      leaveTypeIds: (prev.leaveTypeIds ?? []).includes(leaveTypeId)
        ? (prev.leaveTypeIds ?? []).filter((id) => id !== leaveTypeId)
        : [...(prev.leaveTypeIds ?? []), leaveTypeId],
    }))
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

  const resetForm = () => {
    router.push('/dashboard/employee-management/employees')
  }

  const closePopup = useCallback(() => {
    router.push('/dashboard/employee-management/employees')
    setError(null)
  }, [router])

  const updateMutation = useUpdateEmployeeWithFees({
    onClose: closePopup,
    reset: resetForm,
  })

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!employeeId) return setError('Employee ID is missing')
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
    if (!formData.workStationId || formData.workStationId <= 0)
      return setError('Please select work station')
    if (!formData.divisionId || formData.divisionId <= 0)
      return setError('Please select division')
    if (!formData.costCenterId || formData.costCenterId <= 0)
      return setError('Please select cost center')

    const form = new FormData()
    form.append(
      'employeeDetails',
      JSON.stringify({
        ...formData,
        photoUrl: existingPhotoUrl,
        cvUrl: existingCvUrl,
        certificateUrl: existingCertificateUrl,
        updatedBy: userData?.userId || 0,
      })
    )

    if (employeePhotoFile) form.append('photoUrl', employeePhotoFile)
    if (cvFile) form.append('cvUrl', cvFile)
    if (certificateFile) form.append('certificateUrl', certificateFile)

    try {
      await updateMutation.mutateAsync({
        id: Number(employeeId),
        data: form as any,
      })
      toast({
        title: 'Success!',
        description: 'Employee updated successfully.',
      })
    } catch (err) {
      setError('Failed to update employee')
      console.error('Error updating employee:', err)
    }
  }

  useEffect(() => {
    if (updateMutation.error) {
      setError('Error updating employee')
      console.error('Mutation error:', updateMutation.error)
    }
  }, [updateMutation.error])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p>Loading employee data...</p>
      </div>
    )
  }

  if (!employeeId) {
    return (
      <div className="p-6">
        <div className="text-red-600">Invalid employee ID</div>
      </div>
    )
  }

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <User className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Edit Employee</h2>
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
                  ✓ New photo selected: {employeePhotoFile.name}
                </p>
              )}
              {!employeePhotoFile && existingPhotoUrl && (
                <p className="text-xs text-blue-600">
                  Current photo: {existingPhotoUrl}
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
              <Label htmlFor="doc">Date of Confirmation</Label>
              <Input
                id="doc"
                name="doc"
                type="date"
                value={formData.doc || ''}
                onChange={handleInputChange}
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
                            (t) => t.employmentTypeId === formData.employmentTypeId
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
                items={
                  companies?.data?.map((c) => ({
                    id: c?.companyId?.toString() || '0',
                    name: c.companyName || 'Unnamed company',
                  })) || []
                }
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
              <Label htmlFor="workStationId">
                Work Station <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  workStations?.data?.map((ws) => ({
                    id: ws?.workStationId?.toString() || '0',
                    name: ws.workStationName || 'Unnamed work station',
                  })) || []
                }
                value={
                  formData.workStationId
                    ? {
                        id: formData.workStationId.toString(),
                        name:
                          workStations?.data?.find(
                            (ws) => ws.workStationId === formData.workStationId
                          )?.workStationName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'workStationId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select work station"
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
              <Label htmlFor="costCenterId">
                Cost Center <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  costCenters?.data?.map((cc) => ({
                    id: cc?.costCenterId?.toString() || '0',
                    name: cc.costCenterName || 'Unnamed cost center',
                  })) || []
                }
                value={
                  formData.costCenterId
                    ? {
                        id: formData.costCenterId.toString(),
                        name:
                          costCenters?.data?.find(
                            (cc) => cc.costCenterId === formData.costCenterId
                          )?.costCenterName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'costCenterId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select cost center"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportingAuthorityId">
                Reporting Authority
              </Label>
              <CustomCombobox
                items={
                  employees?.data
                    ?.filter((e) => e.employeeId !== Number(employeeId))
                    .map((emp) => ({
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
                  ✓ New CV selected: {cvFile.name}
                </p>
              )}
              {!cvFile && existingCvUrl && (
                <p className="text-xs text-blue-600">
                  Current CV: {existingCvUrl}
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
                  ✓ New certificate selected: {certificateFile.name}
                </p>
              )}
              {!certificateFile && existingCertificateUrl && (
                <p className="text-xs text-blue-600">
                  Current certificate: {existingCertificateUrl}
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

        {/* ── Contact & Address Information ── */}
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

        {/* ── Leave Types ── */}
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
                      (formData.leaveTypeIds ?? []).includes(leave.leaveTypeId)
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
            {(formData.leaveTypeIds ?? []).length > 0 && (
              <p className="text-xs text-green-600">
                ✓ {(formData.leaveTypeIds ?? []).length} leave type(s) selected
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
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Updating...' : 'Update Employee'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EditEmployee
