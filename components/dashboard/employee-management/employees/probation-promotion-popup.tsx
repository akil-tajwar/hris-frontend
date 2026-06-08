'use client'

import { useCallback, useEffect, useState } from 'react'
import type React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popup } from '@/utils/popup'
import { CustomCombobox } from '@/utils/custom-combobox'
import {
  useUpdateEmployeeWithFees,
  useGetEmployeeById,
  useGetEmploymentTypes,
  useGetLeavePolicies,
  useGetSalaryStructures,
} from '@/hooks/use-api'
import { useAtom } from 'jotai'
import { userDataAtom } from '@/utils/user'
import { toast } from '@/hooks/use-toast'
import { formatDateForInput } from '@/utils/conversions'
import type { GetLeavePolicyType, GetSalaryStructureType } from '@/utils/type'

type ProbationPromotionPopupProps = {
  isOpen: boolean
  onClose: () => void
  employeeId: number
  employeeName: string
}

type PromotionFormData = {
  doc: string
  employmentTypeId: number
  leavePolicyMasterId: number
  salaryStructureMasterId: number
  basicSalary: number
  leavePolicyName: string
  salaryStructureName: string
  employmentTypeName: string
}

const DEFAULT_FORM: PromotionFormData = {
  doc: new Date().toISOString().split('T')[0],
  employmentTypeId: 0,
  leavePolicyMasterId: 0,
  salaryStructureMasterId: 0,
  basicSalary: 0,
  leavePolicyName: '',
  salaryStructureName: '',
  employmentTypeName: '',
}

const ProbationPromotionPopup = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
}: ProbationPromotionPopupProps) => {
  const [userData] = useAtom(userDataAtom)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<PromotionFormData>(DEFAULT_FORM)

  const { data: employee } = useGetEmployeeById(employeeId)
  const { data: employmentTypes } = useGetEmploymentTypes()
  const { data: leavePolicies } = useGetLeavePolicies()
  const { data: salaryStructures } = useGetSalaryStructures()

  useEffect(() => {
    if (!isOpen || !employee?.data) return
    const emp = employee.data as any
    setFormData({
      doc:
        formatDateForInput(emp.doc) || new Date().toISOString().split('T')[0],
      employmentTypeId: emp.employmentTypeId ?? 0,
      leavePolicyMasterId: emp.leavePolicyMasterId ?? 0,
      salaryStructureMasterId: emp.salaryStructureMasterId ?? 0,
      basicSalary: emp.basicSalary ?? 0,
      leavePolicyName: emp.leavePolicyName ?? '',
      salaryStructureName: emp.salaryStructureName ?? '',
      employmentTypeName: emp.employmentTypeName ?? '',
    })
    setError(null)
  }, [isOpen, employee])

  const handleClose = useCallback(() => {
    setError(null)
    onClose()
  }, [onClose])

  const updateMutation = useUpdateEmployeeWithFees({
    onClose: handleClose,
    reset: handleClose,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.doc) return setError('Please select confirmation date')
    if (!formData.employmentTypeId)
      return setError('Please select employment type')
    if (!formData.leavePolicyMasterId)
      return setError('Please select leave policy')
    if (!formData.salaryStructureMasterId)
      return setError('Please select salary structure')
    if (!formData.basicSalary)
      return setError('Please enter valid basic salary')
    if (!employee?.data) return setError('Employee data not loaded yet')

    const emp = employee.data as any
    const form = new FormData()
    form.append(
      'employeeDetails',
      JSON.stringify({
        empFullName: emp.empFullName,
        empShortName: emp.empShortName ?? null,
        dob: formatDateForInput(emp.dob) ?? '',
        gender: emp.gender,
        nationality: emp.nationality ?? null,
        nationalIdNo: emp.nationalIdNo ?? null,
        maritalStatus: emp.maritalStatus ?? null,
        religion: emp.religion ?? null,
        bloodGroup: emp.bloodGroup ?? null,
        photoUrl: emp.photoUrl ?? null,
        cvUrl: emp.cvUrl ?? null,
        certificateUrl: emp.certificateUrl ?? null,
        workEmail: emp.workEmail ?? null,
        privateEmail: emp.privateEmail ?? null,
        homePhone: emp.homePhone ?? null,
        personalPhone: emp.personalPhone ?? null,
        officialPhone: emp.officialPhone ?? '',
        presentAddress: emp.presentAddress ?? '',
        permanentAddress: emp.permanentAddress ?? null,
        country: emp.country ?? null,
        city: emp.city ?? null,
        zipCode: emp.zipCode ?? null,
        emergencyContactName: emp.emergencyContactName ?? null,
        emergencyContactPhone: emp.emergencyContactPhone ?? null,
        emergencyContactRelation: emp.emergencyContactRelation ?? null,
        qualification: emp.qualification ?? 'Graduate',
        instituteName: emp.instituteName ?? null,
        subjectName: emp.subjectName ?? null,
        startDate: formatDateForInput(emp.startDate) ?? null,
        endDate: formatDateForInput(emp.endDate) ?? null,
        result: emp.result ?? null,
        dependentsName: emp.dependentsName ?? null,
        dependentRelation: emp.dependentRelation ?? null,
        empCode: emp.empCode ?? '',
        doj:
          formatDateForInput(emp.doj) ?? new Date().toISOString().split('T')[0],
        isActive: emp.isActive ?? true,
        departmentId: emp.departmentId ?? 0,
        designationId: emp.designationId ?? 0,
        shiftId: emp.shiftId ?? 0,
        companyId: emp.companyId ?? 0,
        workStationId: emp.workStationId ?? 0,
        divisionId: emp.divisionId ?? 0,
        costCenterId: emp.costCenterId ?? 0,
        reportingAuthorityId: emp.reportingAuthorityId ?? null,
        doc: formData.doc,
        employmentTypeId: formData.employmentTypeId,
        leavePolicyMasterId: formData.leavePolicyMasterId,
        salaryStructureMasterId: formData.salaryStructureMasterId,
        basicSalary: formData.basicSalary,
        updatedBy: userData?.userId || 0,
      })
    )

    try {
      await updateMutation.mutateAsync({ id: employeeId, data: form as any })
      toast({
        title: 'Success!',
        description: `${employeeName} has been confirmed successfully.`,
      })
    } catch (err) {
      setError('Failed to confirm employee. Please try again.')
      console.error('Promotion error:', err)
    }
  }

  const toComboboxItem = (id: number, name: string, fallback: string) =>
    id ? { id: id.toString(), name: name || fallback } : null

  const selectedEmploymentType = toComboboxItem(
    formData.employmentTypeId,
    employmentTypes?.data?.find(
      (t: any) => t.employmentTypeId === formData.employmentTypeId
    )?.employmentTypeName || formData.employmentTypeName,
    ''
  )

  const selectedLeavePolicy = toComboboxItem(
    formData.leavePolicyMasterId,
    leavePolicies?.data?.find(
      (p: GetLeavePolicyType) =>
        p.leavePolicyMaster.leavePolicyMasterId === formData.leavePolicyMasterId
    )?.leavePolicyMaster.policyName || formData.leavePolicyName,
    ''
  )

  const selectedSalaryStructure = toComboboxItem(
    formData.salaryStructureMasterId,
    salaryStructures?.data?.find(
      (s: GetSalaryStructureType) =>
        s.salaryStructureMaster.salaryStructureMasterId ===
        formData.salaryStructureMasterId
    )?.salaryStructureMaster.structureName || formData.salaryStructureName,
    ''
  )

  return (
    <Popup
      isOpen={isOpen}
      onClose={handleClose}
      title={`Confirm Probation: ${employeeName}`}
      size="sm:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div className="space-y-2">
          <Label htmlFor="promo-doc">
            Date of Confirmation <span className="text-red-500">*</span>
          </Label>
          <Input
            id="promo-doc"
            type="date"
            value={formData.doc}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, doc: e.target.value }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label>
            Employment Type <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={
              employmentTypes?.data?.map((t: any) => ({
                id: t.employmentTypeId?.toString() ?? '0',
                name: t.employmentTypeName || 'Unnamed type',
              })) ?? []
            }
            value={selectedEmploymentType}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                employmentTypeId: value ? Number(value.id) : 0,
              }))
            }
            placeholder="Select employment type"
          />
        </div>

        <div className="space-y-2">
          <Label>
            Leave Policy <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={
              leavePolicies?.data?.map((p: GetLeavePolicyType) => ({
                id: p.leavePolicyMaster.leavePolicyMasterId?.toString() ?? '0',
                name: p.leavePolicyMaster.policyName || 'Unnamed policy',
              })) ?? []
            }
            value={selectedLeavePolicy}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                leavePolicyMasterId: value ? Number(value.id) : 0,
              }))
            }
            placeholder="Select leave policy"
          />
        </div>

        <div className="space-y-2">
          <Label>
            Salary Structure <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={
              salaryStructures?.data?.map((s: GetSalaryStructureType) => ({
                id:
                  s.salaryStructureMaster.salaryStructureMasterId?.toString() ??
                  '0',
                name:
                  s.salaryStructureMaster.structureName || 'Unnamed structure',
              })) ?? []
            }
            value={selectedSalaryStructure}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                salaryStructureMasterId: value ? Number(value.id) : 0,
              }))
            }
            placeholder="Select salary structure"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="promo-salary">
            Basic Salary <span className="text-red-500">*</span>
          </Label>
          <Input
            id="promo-salary"
            type="number"
            step="0.01"
            min="0"
            value={formData.basicSalary || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                basicSalary: e.target.value ? Number(e.target.value) : 0,
              }))
            }
            placeholder="Enter basic salary"
            required
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending || !employee?.data}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {updateMutation.isPending ? 'Confirming...' : 'Confirm Employee'}
          </Button>
        </div>
      </form>
    </Popup>
  )
}

export default ProbationPromotionPopup
