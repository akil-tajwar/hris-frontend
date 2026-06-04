'use client'

import type React from 'react'
import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Popup } from '@/utils/popup'
import type {
  GetEmployeePreboardingType,
  GetEmployeeType,
  GetChecklistType,
  CreateEmployeePreboardingChecklistType,
  GetEmployeePreboardingChecklistType,
} from '@/utils/type'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle2 } from 'lucide-react'

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
  completionDate: string | null
  status: boolean
  isComplete: boolean
  employeePreboardingChecklistId?: number | null
}

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
          ? new Date(a.completionDate).toLocaleDateString()
          : null,
        status:
          typeof a.status === 'boolean' ? a.status : a.status !== 'Pending',
        isComplete: a.isComplete ?? false,
        employeePreboardingChecklistId: a.employeePreboardingChecklistId,
      }
    })
    setSelected(init)
  }, [isOpen, existingAssignments])

  const isAlreadyAssigned = (checklistDetailsId: number): boolean => {
    return !!existingAssignments?.find(
      (a) => a.checklistDetailsId === checklistDetailsId
    )?.employeePreboardingChecklistId
  }

  const toggleDetail = (detail: ChecklistDetailRow) => {
    // Prevent unchecking tasks that are already saved in the database
    if (isAlreadyAssigned(detail.checklistDetailsId)) return

    setSelected((prev) => {
      if (prev[detail.checklistDetailsId]) {
        const next = { ...prev }
        delete next[detail.checklistDetailsId]
        return next
      }

      return {
        ...prev,
        [detail.checklistDetailsId]: {
          checklistDetailsId: detail.checklistDetailsId,
          responsibleEmployeeId: detail.responsibleEmployeeId,
          completionDate: null,
          status: false,
          isComplete: false,
          employeePreboardingChecklistId: null,
        },
      }
    })
  }

  const handleSave = () => {
    if (!preboarding?.preboardingId) return
    const bulk: CreateEmployeePreboardingChecklistType[] = Object.values(
      selected
    )
      .filter((s) => !s.employeePreboardingChecklistId)
      .map((s) => ({
        employeePreboardingChecklistId: null,
        preboardingId: preboarding.preboardingId!,
        checklistDetailsId: s.checklistDetailsId,
        responsibleEmployeeId: s.responsibleEmployeeId,
        completionDate: null,
        status: s.status,
        isComplete: s.isComplete,
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
      size="sm:max-w-5xl"
    >
      <div className="py-4 space-y-4 pr-1">
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
            <div className="bg-blue-50 px-4 py-2 border-b flex items-center justify-between">
              <span className="font-semibold text-sm text-blue-800">
                {group.masterName}
                {group.details[0]?.responsibleEmployeeName && (
                  <span className="font-normal text-blue-600">
                    {' '}
                    - {group.details[0].responsibleEmployeeName}
                  </span>
                )}
              </span>
            </div>

            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-3 py-2 text-left font-medium text-gray-600">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="w-[40%] px-3 py-2 text-left font-medium text-gray-600">
                    Task
                  </th>
                  <th className="w-[25%] px-3 py-2 text-left font-medium text-gray-600">
                    Completion Date
                  </th>
                  <th className="w-[25%] px-3 py-2 text-left font-medium text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.details.map((detail) => {
                  const isChecked = !!selected[detail.checklistDetailsId]
                  const sel = selected[detail.checklistDetailsId]
                  const locked = isAlreadyAssigned(detail.checklistDetailsId)

                  return (
                    <tr
                      key={detail.checklistDetailsId}
                      className={`border-t transition-colors ${
                        isChecked ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="w-10 px-3 py-2">
                        <Checkbox
                          checked={isChecked}
                          disabled={locked}
                          onCheckedChange={() => toggleDetail(detail)}
                          className={
                            locked ? 'opacity-60 cursor-not-allowed' : ''
                          }
                        />
                      </td>

                      <td
                        className={`w-[40%] px-3 py-2 ${isChecked ? 'text-gray-800' : 'text-gray-500'}`}
                      >
                        {detail.checklistDetailsName}
                      </td>

                      <td className="w-[25%] px-3 py-2 text-gray-600 text-xs">
                        {isChecked ? (
                          (sel.completionDate ?? '—')
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="w-[25%] px-3 py-2">
                        {isChecked ? (
                          sel.isComplete ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                              <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
                              Pending
                            </span>
                          )
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
