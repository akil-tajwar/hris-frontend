'use client'

import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CustomCombobox } from '@/utils/custom-combobox'
import { Popup } from '@/utils/popup'
import {
  useUpdateEmployeeWithFees,
  useGetAllEmployees,
  useGetDepartments,
  useGetDesignations,
  useGetEmploymentTypes,
  useGetShiftDayAndWeekDays,
  useGetLeavePolicies,
  useGetSalaryStructures,
} from '@/hooks/use-api'
import { useAtom } from 'jotai'
import { userDataAtom } from '@/utils/user'
import { toast } from '@/hooks/use-toast'
import { formatDateForInput } from '@/utils/conversions'
import type {
  GetEmployeeType,
  GetLeavePolicyType,
  GetSalaryStructureType,
  GetShiftsType,
} from '@/utils/type'

type BulkEmployeePromotePopupProps = {
  isOpen: boolean
  onClose: () => void
}

type RowData = {
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

const emptyRow = (emp: GetEmployeeType): RowData => ({
  departmentId: (emp as any).departmentId ?? 0,
  designationId: (emp as any).designationId ?? 0,
  employmentTypeId: (emp as any).employmentTypeId ?? 0,
  shiftId: 0,
  leavePolicyMasterId: (emp as any).leavePolicyMasterId ?? 0,
  salaryStructureMasterId: (emp as any).salaryStructureMasterId ?? 0,
  basicSalary: emp.basicSalary ?? 0,
  effectiveFrom: new Date().toISOString().split('T')[0],
  effectiveTo: '',
  changeReason: '',
  approvedBy: 0,
})

const BulkEmployeePromotePopup = ({
  isOpen,
  onClose,
}: BulkEmployeePromotePopupProps) => {
  const [userData] = useAtom(userDataAtom)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Record<number, RowData>>({})

  const { data: employees } = useGetAllEmployees()
  const { data: departments } = useGetDepartments()
  const { data: designations } = useGetDesignations()
  const { data: employmentTypes } = useGetEmploymentTypes()
  const { data: shifts } = useGetShiftDayAndWeekDays()
  const { data: leavePolicies } = useGetLeavePolicies()
  const { data: salaryStructures } = useGetSalaryStructures()

  const allEmployees = useMemo(() => employees?.data ?? [], [employees?.data])

  useEffect(() => {
    if (!isOpen) return
    const initial: Record<number, RowData> = {}
    allEmployees.forEach((emp) => {
      if (emp.employeeId) initial[emp.employeeId] = emptyRow(emp)
    })
    setRows(initial)
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employees?.data])

  const updateRow = (employeeId: number, patch: Partial<RowData>) => {
    setRows((prev) => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], ...patch },
    }))
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const updateMutation = useUpdateEmployeeWithFees({
    onClose: handleClose,
    reset: handleClose,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (allEmployees.length === 0) {
      return setError('No employees to promote')
    }

    for (const emp of allEmployees) {
      const row = rows[emp.employeeId!]
      if (!row?.effectiveFrom) {
        return setError(
          `Please set Effective From for ${emp.empFullName || `Employee #${emp.employeeId}`}`
        )
      }
    }

    const payload = allEmployees.map((emp: any) => {
      const row = rows[emp.employeeId!]
      return {
        employeeId: emp.employeeId,
        tenantId: userData?.tenantId || 0,
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
        doc: formatDateForInput(emp.doc) ?? null,
        isActive: emp.isActive ?? true,
        companyId: emp.companyId ?? 0,
        divisionId: emp.divisionId ?? 0,
        reportingAuthorityId: emp.reportingAuthorityId ?? null,
        // ── Promoted fields ──────────────────────────────────────────────
        departmentId: row.departmentId,
        designationId: row.designationId,
        employmentTypeId: row.employmentTypeId,
        shiftId: row.shiftId || undefined,
        leavePolicyMasterId: row.leavePolicyMasterId,
        salaryStructureMasterId: row.salaryStructureMasterId,
        basicSalary: row.basicSalary,
        // ── History meta ─────────────────────────────────────────────────
        effectiveFrom: row.effectiveFrom,
        effectiveTo: row.effectiveTo || null,
        changeReason: row.changeReason || null,
        approvedBy: row.approvedBy || null,
        createdBy: userData?.userId ?? 0,
        updatedBy: userData?.userId ?? 0,
      }
    })

    const form = new FormData()
    form.append('employeeDetails', JSON.stringify(payload))

    try {
      await updateMutation.mutateAsync({ data: form as any })
      toast({
        title: 'Success!',
        description: `${payload.length} employee(s) promoted successfully.`,
      })
    } catch (err) {
      setError('Failed to promote employees. Please try again.')
      console.error('Bulk promote error:', err)
    }
  }

  return (
    <Popup
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Promote Employees"
      size="sm:max-w-[95vw]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {allEmployees.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            No employees found.
          </p>
        ) : (
          <div className="border rounded-md overflow-x-auto max-h-[65vh]">
            <Table>
              <TableHeader className="bg-blue-100 sticky top-0">
                <TableRow>
                  <TableHead className="whitespace-nowrap">Emp Code</TableHead>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Department
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Designation
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Employment Type
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Shift</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Leave Policy
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Salary Structure
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Basic Salary
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Effective From
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Effective To
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Approved By
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Change Reason
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEmployees.map((emp) => {
                  const row = rows[emp.employeeId!]
                  if (!row) return null
                  return (
                    <TableRow key={emp.employeeId}>
                      <TableCell className="font-medium">
                        {emp.empCode}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {emp.empFullName}
                      </TableCell>
                      <TableCell>
                        <div className="w-52">
                          <CustomCombobox
                            items={
                              departments?.data?.map((d: any) => ({
                                id: d.departmentId?.toString() || '0',
                                name: d.departmentName || 'Unnamed department',
                              })) || []
                            }
                            value={
                              row.departmentId
                                ? {
                                    id: row.departmentId.toString(),
                                    name:
                                      departments?.data?.find(
                                        (d: any) =>
                                          d.departmentId === row.departmentId
                                      )?.departmentName || '',
                                  }
                                : null
                            }
                            onChange={(value) =>
                              updateRow(emp.employeeId!, {
                                departmentId: value ? Number(value.id) : 0,
                              })
                            }
                            placeholder="Select department"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-52">
                          <CustomCombobox
                            items={
                              designations?.data?.map((d: any) => ({
                                id: d.designationId?.toString() || '0',
                                name:
                                  d.designationName || 'Unnamed designation',
                              })) || []
                            }
                            value={
                              row.designationId
                                ? {
                                    id: row.designationId.toString(),
                                    name:
                                      designations?.data?.find(
                                        (d: any) =>
                                          d.designationId === row.designationId
                                      )?.designationName || '',
                                  }
                                : null
                            }
                            onChange={(value) =>
                              updateRow(emp.employeeId!, {
                                designationId: value ? Number(value.id) : 0,
                              })
                            }
                            placeholder="Select designation"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-52">
                          <CustomCombobox
                            items={
                              employmentTypes?.data?.map((t: any) => ({
                                id: t.employmentTypeId?.toString() || '0',
                                name: t.employmentTypeName || 'Unnamed type',
                              })) || []
                            }
                            value={
                              row.employmentTypeId
                                ? {
                                    id: row.employmentTypeId.toString(),
                                    name:
                                      employmentTypes?.data?.find(
                                        (t: any) =>
                                          t.employmentTypeId ===
                                          row.employmentTypeId
                                      )?.employmentTypeName || '',
                                  }
                                : null
                            }
                            onChange={(value) =>
                              updateRow(emp.employeeId!, {
                                employmentTypeId: value ? Number(value.id) : 0,
                              })
                            }
                            placeholder="Select type"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-52">
                          <CustomCombobox
                            items={
                              shifts?.data
                                ?.filter(
                                  (s: GetShiftsType) => s.shift?.shiftId != null
                                )
                                .map((s: GetShiftsType) => ({
                                  id: s.shift.shiftId!.toString(),
                                  name: s.shift.shiftName || 'Unnamed shift',
                                })) || []
                            }
                            value={
                              row.shiftId
                                ? {
                                    id: row.shiftId.toString(),
                                    name:
                                      shifts?.data?.find(
                                        (s: GetShiftsType) =>
                                          s.shift.shiftId === row.shiftId
                                      )?.shift.shiftName || '',
                                  }
                                : null
                            }
                            onChange={(value) =>
                              updateRow(emp.employeeId!, {
                                shiftId: value ? Number(value.id) : 0,
                              })
                            }
                            placeholder="Select shift"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-52">
                          <CustomCombobox
                            items={
                              leavePolicies?.data?.map(
                                (p: GetLeavePolicyType) => ({
                                  id:
                                    p.leavePolicyMaster.leavePolicyMasterId?.toString() ||
                                    '0',
                                  name:
                                    p.leavePolicyMaster.policyName ||
                                    'Unnamed policy',
                                })
                              ) || []
                            }
                            value={
                              row.leavePolicyMasterId
                                ? {
                                    id: row.leavePolicyMasterId.toString(),
                                    name:
                                      leavePolicies?.data?.find(
                                        (p: GetLeavePolicyType) =>
                                          p.leavePolicyMaster
                                            .leavePolicyMasterId ===
                                          row.leavePolicyMasterId
                                      )?.leavePolicyMaster.policyName || '',
                                  }
                                : null
                            }
                            onChange={(value) =>
                              updateRow(emp.employeeId!, {
                                leavePolicyMasterId: value
                                  ? Number(value.id)
                                  : 0,
                              })
                            }
                            placeholder="Select policy"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-52">
                          <CustomCombobox
                            items={
                              salaryStructures?.data?.map(
                                (s: GetSalaryStructureType) => ({
                                  id:
                                    s.salaryStructureMaster.salaryStructureMasterId?.toString() ||
                                    '0',
                                  name:
                                    s.salaryStructureMaster.structureName ||
                                    'Unnamed structure',
                                })
                              ) || []
                            }
                            value={
                              row.salaryStructureMasterId
                                ? {
                                    id: row.salaryStructureMasterId.toString(),
                                    name:
                                      salaryStructures?.data?.find(
                                        (s: GetSalaryStructureType) =>
                                          s.salaryStructureMaster
                                            .salaryStructureMasterId ===
                                          row.salaryStructureMasterId
                                      )?.salaryStructureMaster.structureName ||
                                      '',
                                  }
                                : null
                            }
                            onChange={(value) =>
                              updateRow(emp.employeeId!, {
                                salaryStructureMasterId: value
                                  ? Number(value.id)
                                  : 0,
                              })
                            }
                            placeholder="Select structure"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-28"
                          value={row.basicSalary || ''}
                          onChange={(e) =>
                            updateRow(emp.employeeId!, {
                              basicSalary: e.target.value
                                ? Number(e.target.value)
                                : 0,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          className="w-36"
                          value={row.effectiveFrom}
                          onChange={(e) =>
                            updateRow(emp.employeeId!, {
                              effectiveFrom: e.target.value,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          className="w-36"
                          value={row.effectiveTo}
                          onChange={(e) =>
                            updateRow(emp.employeeId!, {
                              effectiveTo: e.target.value,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="w-52">
                          <CustomCombobox
                            items={
                              allEmployees
                                .filter((e) => e.employeeId !== emp.employeeId)
                                .map((e) => ({
                                  id: e.employeeId!.toString(),
                                  name: e.empFullName || 'Unnamed employee',
                                })) || []
                            }
                            value={
                              row.approvedBy
                                ? {
                                    id: row.approvedBy.toString(),
                                    name:
                                      allEmployees.find(
                                        (e) => e.employeeId === row.approvedBy
                                      )?.empFullName || '',
                                  }
                                : null
                            }
                            onChange={(value) =>
                              updateRow(emp.employeeId!, {
                                approvedBy: value ? Number(value.id) : 0,
                              })
                            }
                            placeholder="Select approver"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          maxLength={250}
                          className="w-44"
                          placeholder="Reason"
                          value={row.changeReason}
                          onChange={(e) =>
                            updateRow(emp.employeeId!, {
                              changeReason: e.target.value,
                            })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

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
            disabled={updateMutation.isPending || allEmployees.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {updateMutation.isPending
              ? 'Promoting...'
              : `Promote Employee(s)`}
          </Button>
        </div>
      </form>
    </Popup>
  )
}

export default BulkEmployeePromotePopup
