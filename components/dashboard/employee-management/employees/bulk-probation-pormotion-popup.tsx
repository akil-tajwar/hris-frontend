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
  useGetEmploymentTypes,
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
} from '@/utils/type'

type BulkProbationPromotionPopupProps = {
  isOpen: boolean
  onClose: () => void
}

type RowData = {
  doc: string
  employmentTypeId: number
  leavePolicyMasterId: number
  salaryStructureMasterId: number
  basicSalary: number
  performedBy: number
}

const emptyRow = (emp: GetEmployeeType, performedBy: number): RowData => ({
  doc: new Date().toISOString().split('T')[0],
  employmentTypeId: (emp as any).employmentTypeId ?? 0,
  leavePolicyMasterId: (emp as any).leavePolicyMasterId ?? 0,
  salaryStructureMasterId: (emp as any).salaryStructureMasterId ?? 0,
  basicSalary: emp.basicSalary ?? 0,
  performedBy,
})

const BulkProbationPromotionPopup = ({
  isOpen,
  onClose,
}: BulkProbationPromotionPopupProps) => {
  const [userData] = useAtom(userDataAtom)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Record<number, RowData>>({})

  const { data: employees } = useGetAllEmployees()
  const { data: employmentTypes } = useGetEmploymentTypes()
  const { data: leavePolicies } = useGetLeavePolicies()
  const { data: salaryStructures } = useGetSalaryStructures()

  const probationEmployees = useMemo(
    () =>
      employees?.data?.filter(
        (emp: any) => emp.employmentTypeName === 'Probation'
      ) ?? [],
    [employees?.data]
  )

  useEffect(() => {
    if (!isOpen) return
    const initial: Record<number, RowData> = {}
    probationEmployees.forEach((emp) => {
      if (emp.employeeId)
        initial[emp.employeeId] = emptyRow(emp, userData?.userId ?? 0)
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

    if (probationEmployees.length === 0) {
      return setError('No probation employees to confirm')
    }

    for (const emp of probationEmployees) {
      const row = rows[emp.employeeId!]
      if (
        !row?.doc ||
        !row.employmentTypeId ||
        !row.leavePolicyMasterId ||
        !row.salaryStructureMasterId ||
        !row.basicSalary ||
        !row.performedBy
      ) {
        return setError(
          `Please fill all fields for ${emp.empFullName || `Employee #${emp.employeeId}`}`
        )
      }
    }

    const payload = probationEmployees.map((emp: any) => {
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
        isActive: emp.isActive ?? true,
        departmentId: emp.departmentId ?? 0,
        designationId: emp.designationId ?? 0,
        companyId: emp.companyId ?? 0,
        divisionId: emp.divisionId ?? 0,
        reportingAuthorityId: emp.reportingAuthorityId ?? null,
        doc: row.doc,
        employmentTypeId: row.employmentTypeId,
        leavePolicyMasterId: row.leavePolicyMasterId,
        salaryStructureMasterId: row.salaryStructureMasterId,
        basicSalary: row.basicSalary,
        createdBy: row.performedBy,
        updatedBy: userData?.userId || 0,
      }
    })

    const form = new FormData()
    form.append('employeeDetails', JSON.stringify(payload))

    try {
      await updateMutation.mutateAsync({ data: form as any })
      toast({
        title: 'Success!',
        description: `${payload.length} employee(s) confirmed successfully.`,
      })
    } catch (err) {
      setError('Failed to confirm employees. Please try again.')
      console.error('Bulk probation confirm error:', err)
    }
  }

  return (
    <Popup
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Confirm Probation Employees"
      size="sm:max-w-6xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {probationEmployees.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            No probation employees found.
          </p>
        ) : (
          <div className="border rounded-md overflow-x-auto max-h-[60vh]">
            <Table>
              <TableHeader className="bg-blue-100 sticky top-0">
                <TableRow>
                  <TableHead className="whitespace-nowrap">Emp Code</TableHead>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Confirmation Date
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    New Employment Type
                  </TableHead>
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
                    Performed By
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {probationEmployees.map((emp) => {
                  const row = rows[emp.employeeId!]
                  if (!row) return null
                  return (
                    <TableRow key={emp.employeeId}>
                      <TableCell className="font-medium">
                        {emp.empCode}
                      </TableCell>
                      <TableCell>{emp.empFullName}</TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          className="w-40"
                          value={row.doc}
                          onChange={(e) =>
                            updateRow(emp.employeeId!, { doc: e.target.value })
                          }
                        />
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
                          className="w-32"
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
                        <div className="w-52">
                          <CustomCombobox
                            items={
                              employees?.data
                                ?.filter((e) => e.employeeId !== emp.employeeId)
                                .map((e) => ({
                                  id: e.employeeId!.toString(),
                                  name: e.empFullName || 'Unnamed employee',
                                })) || []
                            }
                            value={
                              row.performedBy
                                ? {
                                    id: row.performedBy.toString(),
                                    name:
                                      employees?.data?.find(
                                        (e) => e.employeeId === row.performedBy
                                      )?.empFullName || '',
                                  }
                                : null
                            }
                            onChange={(value) =>
                              updateRow(emp.employeeId!, {
                                performedBy: value ? Number(value.id) : 0,
                              })
                            }
                            placeholder="Select performed by"
                          />
                        </div>
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
            disabled={
              updateMutation.isPending || probationEmployees.length === 0
            }
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {updateMutation.isPending
              ? 'Confirming...'
              : `Confirm Employee(s)`}
          </Button>
        </div>
      </form>
    </Popup>
  )
}

export default BulkProbationPromotionPopup
