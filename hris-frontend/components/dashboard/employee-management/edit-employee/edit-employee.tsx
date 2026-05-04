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
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import { useRouter, useParams } from 'next/navigation'
import { CustomCombobox } from '@/utils/custom-combobox'
import {
  useUpdateEmployeeWithFees,
  useGetDepartments,
  useGetDesignations,
  useGetEmployeeTypes,
  useGetLeaveTypes,
  useGetOfficeTimingWeekends,
  useGetEmployeeById,
} from '@/hooks/use-api'
import type { CreateEmployeeType } from '@/utils/type'
import { toast } from '@/hooks/use-toast'
import { formatTime } from '@/utils/conversions'

const EditEmployee = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const router = useRouter()

  const params = useParams()
  const employeeId = params.employeeId
  const { data: employee } = useGetEmployeeById(
    employeeId ? Number(employeeId) : 0
  )
  console.log('🚀 ~ EditEmployee ~ employee:', employee)

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
  const [loading, setLoading] = useState(true)
  const [employeePhotoFile, setEmployeePhotoFile] = useState<File | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [existingCvUrl, setExistingCvUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState<
    Omit<
      CreateEmployeeType,
      'employeeId' | 'createdAt' | 'updatedAt' | 'createdBy'
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
    updatedBy: userData?.userId || 0,
  })

  // Load employee data
  useEffect(() => {
    if (employee?.data) {
      const emp = employee.data

      setFormData({
        empFullName: emp.empFullName || '',
        workEmail: emp.workEmail || '',
        officialPhone: emp.officialPhone || '',
        personalPhone: emp.personalPhone || null,
        presentAddress: emp.presentAddress || '',
        permanentAddress: emp.permanentAddress || null,
        emergencyContactName: emp.emergencyContactName || null,
        emergencyContactPhone: emp.emergencyContactPhone || null,
        photoUrl: emp.photoUrl || null,
        cvUrl: emp.cvUrl || null,
        dob: emp.dob || '',
        doj: emp.doj || new Date().toISOString().split('T')[0],
        gender: emp.gender || 'Male',
        bloodGroup: emp.bloodGroup || null,
        basicSalary: emp.basicSalary || 0,
        isActive: emp.isActive ?? 1,
        empCode: emp.empCode || '',
        departmentId: emp.departmentId || 0,
        designationId: emp.designationId || 0,
        employeeTypeId: emp.employeeTypeId || 0,
        leaveTypeIds: emp.leaveTypeIds || [],
        officeTimingId: emp.officeTimingId || 0,
        updatedBy: emp.updatedBy || userData?.userId || 0,
      })

      setExistingPhotoUrl(emp.photoUrl || null)
      setExistingCvUrl(emp.cvUrl || null)
      setLoading(false)
    }
  }, [employee, userData])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement

    if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? Number(value) : null,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value || null,
      }))
    }
  }

  const handleEmployeePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      setEmployeePhotoFile(file)
    }
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
      setFormData((prev) => ({
        ...prev,
        [name]: value || null,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? Number(value) : null,
      }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!employeeId) {
      setError('Employee ID is missing')
      return
    }

    console.log('=== FORM SUBMISSION START ===')
    console.log('📋 Employee Details:', formData)

    // Validations
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

    const employeeDetailsPayload = {
      ...formData,
      photoUrl: existingPhotoUrl,
      cvUrl: existingCvUrl,
      //   updatedBy: formData.updatedBy,
      updatedBy: userData?.userId || 0,
    }
    console.log('📦 Employee Details Payload:', employeeDetailsPayload)
    form.append('employeeDetails', JSON.stringify(employeeDetailsPayload))

    if (employeePhotoFile) {
      form.append('photoUrl', employeePhotoFile)
      console.log(`✅ Appended new photoUrl to FormData`)
    }

    if (cvFile) {
      form.append('cvUrl', cvFile)
      console.log(`✅ Appended new cvUrl to FormData`)
    }

    console.log('📤 FormData contents:')
    for (const pair of form.entries()) {
      if (pair[1] instanceof File) {
        console.log(
          `  ${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`
        )
      } else {
        console.log(`  ${pair[0]}: ${pair[1]}`)
      }
    }
    console.log('=== FORM SUBMISSION END ===')

    try {
      await updateMutation.mutateAsync({
        id: Number(employeeId),
        data: form as any,
      })
      console.log('✅ Employee updated successfully!')
      toast({
        title: 'Success!',
        description: 'Employee updated successfully.',
      })
    } catch (err) {
      setError('Failed to update employee')
      console.error('❌ Error updating employee:', err)
    }
  }

  useEffect(() => {
    if (updateMutation.error) {
      setError('Error updating employee')
      console.error('❌ Mutation error:', updateMutation.error)
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
                    name: `${formatTime(timing.startTime)} - ${formatTime(timing.endTime)}${
                      timing.weekends?.length
                        ? ` (Off: ${timing.weekends.join(', ')})`
                        : ''
                    }`,
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
                            ? `${formatTime(t.startTime)} - ${formatTime(t.endTime)}${
                                t.weekends?.length
                                  ? ` (Off: ${t.weekends.join(', ')})`
                                  : ''
                              }`
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

        {/* Leave Types — multi-select checkboxes */}
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
