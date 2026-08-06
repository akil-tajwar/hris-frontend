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
  useGetDepartments,
  useGetDesignations,
  useGetShiftDayAndWeekDays,
  useGetAllEmployees,
} from '@/hooks/use-api'
import { useAtom } from 'jotai'
import { userDataAtom } from '@/utils/user'
import { formatDateForInput } from '@/utils/conversions'
import type {
  GetLeavePolicyType,
  GetSalaryStructureType,
  GetEmployeeType,
  GetShiftsType,
} from '@/utils/type'

type PromoteEmployeePopupProps = {
  isOpen: boolean
  onClose: () => void
  employeeId: number
  employeeName: string
}

type PromoteFormData = {
  departmentId: number
  designationId: number
  employmentTypeId: number
  shiftId: number
  leavePolicyMasterId: number
  salaryStructureMasterId: number
  basicSalary: number
  effectiveFrom: string
  effectiveTo: string
  changeReason: string
  approvedBy: number
}

const DEFAULT_FORM: PromoteFormData = {
  departmentId: 0,
  designationId: 0,
  employmentTypeId: 0,
  shiftId: 0,
  leavePolicyMasterId: 0,
  salaryStructureMasterId: 0,
  basicSalary: 0,
  effectiveFrom: new Date().toISOString().split('T')[0],
  effectiveTo: '',
  changeReason: '',
  approvedBy: 0,
}

const PromoteEmployeePopup = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
}: PromoteEmployeePopupProps) => {
  const [userData] = useAtom(userDataAtom)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<PromoteFormData>(DEFAULT_FORM)

  const { data: employee } = useGetEmployeeById(employeeId)
  const { data: departments } = useGetDepartments()
  const { data: designations } = useGetDesignations()
  const { data: employmentTypes } = useGetEmploymentTypes()
  const { data: shifts } = useGetShiftDayAndWeekDays()
  const { data: leavePolicies } = useGetLeavePolicies()
  const { data: salaryStructures } = useGetSalaryStructures()
  const { data: allEmployees } = useGetAllEmployees()

  useEffect(() => {
    if (!isOpen || !employee?.data) return
    const emp = employee.data as any
    setFormData({
      departmentId: emp.departmentId ?? 0,
      designationId: emp.designationId ?? 0,
      employmentTypeId: emp.employmentTypeId ?? 0,
      shiftId: emp.shiftId ?? 0,
      leavePolicyMasterId: emp.leavePolicyMasterId ?? 0,
      salaryStructureMasterId: emp.salaryStructureMasterId ?? 0,
      basicSalary: emp.basicSalary ?? 0,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      changeReason: '',
      approvedBy: 0,
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

    if (!formData.effectiveFrom) return setError('Effective From is required')
    if (!employee?.data) return setError('Employee data not loaded yet')

    const emp = employee.data as any
    const form = new FormData()

    form.append(
      'employeeDetails',
      JSON.stringify([
        {
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
            formatDateForInput(emp.doj) ??
            new Date().toISOString().split('T')[0],
          doc: formatDateForInput(emp.doc) ?? null,
          isActive: emp.isActive ?? true,
          companyId: emp.companyId ?? 0,
          workStationId: emp.workStationId ?? 0,
          divisionId: emp.divisionId ?? 0,
          costCenterId: emp.costCenterId ?? 0,
          reportingAuthorityId: emp.reportingAuthorityId ?? null,
          // ── Promoted fields ────────────────────────────────────────────────
          departmentId: formData.departmentId,
          designationId: formData.designationId,
          employmentTypeId: formData.employmentTypeId,
          shiftId: formData.shiftId,
          leavePolicyMasterId: formData.leavePolicyMasterId,
          salaryStructureMasterId: formData.salaryStructureMasterId,
          basicSalary: formData.basicSalary,
          // ── History meta ───────────────────────────────────────────────────
          effectiveFrom: formData.effectiveFrom,
          effectiveTo: formData.effectiveTo || null,
          changeReason: formData.changeReason || null,
          approvedBy: formData.approvedBy || null,
          createdBy: userData?.userId ?? 0,
          updatedBy: userData?.userId ?? 0,
        },
      ])
    )

    try {
      await updateMutation.mutateAsync({ data: form as any })
    } catch (err) {
      setError('Failed to promote employee. Please try again.')
      console.error('Promote error:', err)
    }
  }

  // ── Combobox helpers ─────────────────────────────────────────────────────

  const toItem = (id: number, name: string) =>
    id ? { id: id.toString(), name: name || String(id) } : null

  const selectedDepartment = toItem(
    formData.departmentId,
    departments?.data?.find(
      (d: any) => d.departmentId === formData.departmentId
    )?.departmentName ?? ''
  )

  const selectedDesignation = toItem(
    formData.designationId,
    designations?.data?.find(
      (d: any) => d.designationId === formData.designationId
    )?.designationName ?? ''
  )

  const selectedEmploymentType = toItem(
    formData.employmentTypeId,
    employmentTypes?.data?.find(
      (t: any) => t.employmentTypeId === formData.employmentTypeId
    )?.employmentTypeName ?? ''
  )

  const selectedShift = toItem(
    formData.shiftId,
    shifts?.data?.find(
      (s: GetShiftsType) => s.shift.shiftId === formData.shiftId
    )?.shift.shiftName ?? ''
  )

  const selectedLeavePolicy = toItem(
    formData.leavePolicyMasterId,
    leavePolicies?.data?.find(
      (p: GetLeavePolicyType) =>
        p.leavePolicyMaster.leavePolicyMasterId === formData.leavePolicyMasterId
    )?.leavePolicyMaster.policyName ?? ''
  )

  const selectedSalaryStructure = toItem(
    formData.salaryStructureMasterId,
    salaryStructures?.data?.find(
      (s: GetSalaryStructureType) =>
        s.salaryStructureMaster.salaryStructureMasterId ===
        formData.salaryStructureMasterId
    )?.salaryStructureMaster.structureName ?? ''
  )

  const selectedApprovedBy = toItem(
    formData.approvedBy,
    allEmployees?.data?.find(
      (e: GetEmployeeType) => e.employeeId === formData.approvedBy
    )?.empFullName ?? ''
  )

  return (
    <Popup
      isOpen={isOpen}
      onClose={handleClose}
      title={`Promote Employee: ${employeeName}`}
      size="sm:max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {/* ── Role / assignment fields ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Department</Label>
            <CustomCombobox
              items={
                departments?.data?.map((d: any) => ({
                  id: d.departmentId.toString(),
                  name: d.departmentName || 'Unnamed',
                })) ?? []
              }
              value={selectedDepartment}
              onChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  departmentId: v ? Number(v.id) : 0,
                }))
              }
              placeholder="Select department"
            />
          </div>

          <div className="space-y-2">
            <Label>Designation</Label>
            <CustomCombobox
              items={
                designations?.data?.map((d: any) => ({
                  id: d.designationId.toString(),
                  name: d.designationName || 'Unnamed',
                })) ?? []
              }
              value={selectedDesignation}
              onChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  designationId: v ? Number(v.id) : 0,
                }))
              }
              placeholder="Select designation"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Employment Type <span className="text-red-500">*</span>
            </Label>
            <CustomCombobox
              items={
                employmentTypes?.data?.map((t: any) => ({
                  id: t.employmentTypeId.toString(),
                  name: t.employmentTypeName || 'Unnamed',
                })) ?? []
              }
              value={selectedEmploymentType}
              onChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  employmentTypeId: v ? Number(v.id) : 0,
                }))
              }
              placeholder="Select employment type"
            />
          </div>

          <div className="space-y-2">
            <Label>Shift</Label>
            <CustomCombobox
              items={
                shifts?.data
                  ?.filter((s: GetShiftsType) => s.shift?.shiftId != null)
                  .map((s: GetShiftsType) => ({
                    id: s.shift.shiftId!.toString(),
                    name: s.shift.shiftName || 'Unnamed',
                  })) ?? []
              }
              value={selectedShift}
              onChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  shiftId: v ? Number(v.id) : 0,
                }))
              }
              placeholder="Select shift"
            />
          </div>

          <div className="space-y-2">
            <Label>Leave Policy</Label>
            <CustomCombobox
              items={
                leavePolicies?.data
                  ?.map((p: GetLeavePolicyType) => {
                    const id = p.leavePolicyMaster?.leavePolicyMasterId
                    return id
                      ? {
                          id: id.toString(),
                          name: p.leavePolicyMaster?.policyName || 'Unnamed',
                        }
                      : null
                  })
                  .filter(
                    (item): item is { id: string; name: string } =>
                      item !== null
                  ) ?? []
              }
              value={selectedLeavePolicy}
              onChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  leavePolicyMasterId: v ? Number(v.id) : 0,
                }))
              }
              placeholder="Select leave policy"
            />
          </div>

          <div className="space-y-2">
            <Label>Salary Structure</Label>
            <CustomCombobox
              items={
                salaryStructures?.data
                  ?.map((s: GetSalaryStructureType) => {
                    const id = s.salaryStructureMaster?.salaryStructureMasterId
                    return id
                      ? {
                          id: id.toString(),
                          name:
                            s.salaryStructureMaster?.structureName || 'Unnamed',
                        }
                      : null
                  })
                  .filter(
                    (item): item is { id: string; name: string } =>
                      item !== null
                  ) ?? []
              }
              value={selectedSalaryStructure}
              onChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  salaryStructureMasterId: v ? Number(v.id) : 0,
                }))
              }
              placeholder="Select salary structure"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="promote-salary">Basic Salary</Label>
          <Input
            id="promote-salary"
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
          />
        </div>

        {/* ── History fields ───────────────────────────────────────────── */}
        <div className="border-t pt-4 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Promotion History
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="promote-effectiveFrom">
                Effective From <span className="text-red-500">*</span>
              </Label>
              <Input
                id="promote-effectiveFrom"
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    effectiveFrom: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promote-effectiveTo">Effective To</Label>
              <Input
                id="promote-effectiveTo"
                type="date"
                value={formData.effectiveTo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    effectiveTo: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Approved By</Label>
            <CustomCombobox
              items={
                allEmployees?.data?.map((e: GetEmployeeType) => ({
                  id: e.employeeId!.toString(),
                  name: e.empFullName || 'Unnamed',
                })) ?? []
              }
              value={selectedApprovedBy}
              onChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  approvedBy: v ? Number(v.id) : 0,
                }))
              }
              placeholder="Select approving employee"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promote-reason">Change Reason</Label>
            <textarea
              id="promote-reason"
              maxLength={250}
              rows={3}
              value={formData.changeReason}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  changeReason: e.target.value,
                }))
              }
              placeholder="e.g. Annual appraisal, role change"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.changeReason.length}/250
            </p>
          </div>
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
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {updateMutation.isPending ? 'Promoting...' : 'Promote Employee'}
          </Button>
        </div>
      </form>
    </Popup>
  )
}

export default PromoteEmployeePopup
