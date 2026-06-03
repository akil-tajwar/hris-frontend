'use client'

import type React from 'react'
import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popup } from '@/utils/popup'
import type {
  GetEmployeePreboardingType,
  GetEmployeeType,
  GetChecklistType,
  CreateEmployeePreboardingChecklistType,
  GetEmployeePreboardingChecklistType,
} from '@/utils/type'
import CustomSwitch from '@/utils/custom-switch'
import { Checkbox } from '@/components/ui/checkbox'

interface ChecklistDetailRow {
  checklistDetailsId: number
  checklistDetailsName: string
  checklistMasterId: number | null
  responsibleEmployeeId: number
  responsibleEmployeeName?: string | null
}

interface SelectedChecklistDetail {
  checklistDetailsId: number
  responsibleEmployeeId: number
  completionDate: string
  status: boolean
  // existing record id for update
  employeePreboardingChecklistId?: number | null
}

// ─── Checklist Popup ──────────────────────────────────────────────────────────

interface ChecklistPopupProps {
  isOpen: boolean
  onClose: () => void
  preboarding: GetEmployeePreboardingType | null
  checklists: GetChecklistType[] | undefined
  employees: GetEmployeeType[] | undefined
  existingAssignments: GetEmployeePreboardingChecklistType[] | undefined
  userId: number
  onSave: (bulk: CreateEmployeePreboardingChecklistType[]) => void
  isSaving: boolean
}

export const ChecklistPopup: React.FC<ChecklistPopupProps> = ({
  isOpen,
  onClose,
  preboarding,
  checklists,
  existingAssignments,
  userId,
  onSave,
  isSaving,
}) => {
  const [selected, setSelected] = useState<
    Record<number, SelectedChecklistDetail>
  >({})

  useEffect(() => {
    if (!isOpen) return
    const init: Record<number, SelectedChecklistDetail> = {}
    existingAssignments?.forEach((a) => {
      init[a.checklistDetailsId] = {
        checklistDetailsId: a.checklistDetailsId,
        responsibleEmployeeId: a.responsibleEmployeeId,
        completionDate: a.completionDate
          ? new Date(a.completionDate).toISOString().slice(0, 10)
          : '',
        status:
          typeof a.status === 'boolean' ? a.status : a.status !== 'Pending',
        employeePreboardingChecklistId: a.employeePreboardingChecklistId,
      }
    })
    setSelected(init)
  }, [isOpen, existingAssignments])

  const allDetails = useMemo<ChecklistDetailRow[]>(() => {
    if (!checklists) return []
    return checklists.flatMap((cl) =>
      cl.checklistDetails.map((d) => ({
        checklistDetailsId: d.checklistDetailsId!,
        checklistDetailsName: d.checklistDetailsName,
        checklistMasterId: d.checklistMasterId,
        responsibleEmployeeId: d.responsibleEmployeeId,
        responsibleEmployeeName: d.responsibleEmployeeName,
      }))
    )
  }, [checklists])

  const toggleDetail = (detail: ChecklistDetailRow) => {
    setSelected((prev) => {
      if (prev[detail.checklistDetailsId]) {
        const next = { ...prev }
        delete next[detail.checklistDetailsId]
        return next
      }
      const existing = existingAssignments?.find(
        (a) => a.checklistDetailsId === detail.checklistDetailsId
      )
      return {
        ...prev,
        [detail.checklistDetailsId]: {
          checklistDetailsId: detail.checklistDetailsId,
          responsibleEmployeeId:
            existing?.responsibleEmployeeId ?? detail.responsibleEmployeeId,
          completionDate: existing?.completionDate
            ? new Date(existing.completionDate).toISOString().slice(0, 10)
            : '',
          status: existing?.status ?? false,
          employeePreboardingChecklistId:
            existing?.employeePreboardingChecklistId ?? null,
        },
      }
    })
  }

  const updateField = (
    id: number,
    field: keyof SelectedChecklistDetail,
    value: string | number | boolean
  ) => {
    setSelected((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  const handleSave = () => {
    if (!preboarding?.preboardingId) return
    const bulk: CreateEmployeePreboardingChecklistType[] = Object.values(
      selected
    ).map((s) => ({
      employeePreboardingChecklistId: s.employeePreboardingChecklistId ?? null,
      preboardingId: preboarding.preboardingId!,
      checklistDetailsId: s.checklistDetailsId,
      responsibleEmployeeId: s.responsibleEmployeeId,
      completionDate: s.completionDate
        ? new Date(s.completionDate)
        : new Date(),
      status: s.status,
      createdBy: userId,
    }))
    onSave(bulk)
  }

  const grouped = useMemo(() => {
    const map: Record<
      string,
      { masterName: string; details: ChecklistDetailRow[] }
    > = {}
    checklists?.forEach((cl) => {
      const key = cl.checklistMaster.checklistMasterId?.toString() ?? 'unknown'
      map[key] = {
        masterName: cl.checklistMaster.checklistName,
        details: cl.checklistDetails.map((d) => ({
          checklistDetailsId: d.checklistDetailsId!,
          checklistDetailsName: d.checklistDetailsName,
          checklistMasterId: d.checklistMasterId,
          responsibleEmployeeId: d.responsibleEmployeeId,
          responsibleEmployeeName: d.responsibleEmployeeName,
        })),
      }
    })
    return Object.values(map)
  }, [checklists])

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Checklists — ${preboarding?.fullName ?? ''}`}
      size="sm:max-w-3xl"
    >
      <div className="py-4 space-y-4  pr-1">
        {grouped.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            No checklists available.
          </p>
        )}

        {grouped.map((group) => (
          <div
            key={group.masterName}
            className="border rounded-md overflow-hidden"
          >
            <div className="bg-blue-50 px-4 py-2 border-b">
              <span className="font-semibold text-sm text-blue-800">
                {group.masterName}
              </span>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-3 py-2 text-left font-medium text-gray-600">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    Task
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    Completion Date
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.details.map((detail) => {
                  const isChecked = !!selected[detail.checklistDetailsId]
                  const sel = selected[detail.checklistDetailsId]
                  return (
                    <tr
                      key={detail.checklistDetailsId}
                      className={`border-t transition-colors ${isChecked ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleDetail(detail)}
                        />
                      </td>

                      <td className="px-3 py-2 text-gray-800">
                        {detail.checklistDetailsName}
                      </td>

                      <td className="px-3 py-2">
                        {isChecked ? (
                          <Input
                            type="date"
                            className="h-8 text-sm"
                            value={sel.completionDate}
                            onChange={(e) =>
                              updateField(
                                detail.checklistDetailsId,
                                'completionDate',
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-3 py-2">
                        {isChecked ? (
                          <CustomSwitch
                            label=""
                            checked={sel.status}
                            onChange={(value) =>
                              updateField(
                                detail.checklistDetailsId,
                                'status',
                                value
                              )
                            }
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-3 border-t">
        <span className="text-xs text-gray-500">
          {Object.keys(selected).length} task(s) selected
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isSaving ? 'Saving...' : 'Save Assignments'}
          </Button>
        </div>
      </div>
    </Popup>
  )
}
