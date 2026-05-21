'use client'

import type React from 'react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  ArrowUpDown,
  Search,
  ClipboardList,
  Edit2,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateEmployeePreboardingType,
  GetEmployeePreboardingType,
  GetDepartmentType,
  GetSalaryStructureType,
  GetEmploymentTypeType,
  GetEmployeeType,
  GetDesignationType,
  GetCompanyType,
  GetChecklistType,
  CreateEmployeePreboardingChecklistType,
  GetEmployeePreboardingChecklistType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetAllEmployeePreboardings,
  useCreateEmployeePreboarding,
  useEditEmployeePreboarding,
  useDeleteEmployeePreboarding,
  useGetDepartments,
  useGetDesignations,
  useGetAllEmployees,
  useGetEmploymentTypes,
  useGetSalaryStructures,
  useGetCompanies,
  useGetChecklists,
  useGetPreboardingEmployeeChecklistsById,
  useAddPreboardingEmployeeChecklists,
  useUpdatePreboardingEmployeeChecklists,
} from '@/hooks/use-api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CustomCombobox } from '@/utils/custom-combobox'
import CustomSwitch from '@/utils/custom-switch'
import { Checkbox } from '@/components/ui/checkbox'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  status: string
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

const ChecklistPopup: React.FC<ChecklistPopupProps> = ({
  isOpen,
  onClose,
  preboarding,
  checklists,
  employees,
  existingAssignments,
  userId,
  onSave,
  isSaving,
}) => {
  // Map of checklistDetailsId → selected detail state
  const [selected, setSelected] = useState<
    Record<number, SelectedChecklistDetail>
  >({})

  // Initialise from existing assignments whenever popup opens
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
        status: a.status,
        employeePreboardingChecklistId: a.employeePreboardingChecklistId,
      }
    })
    setSelected(init)
  }, [isOpen, existingAssignments])

  // Flatten all details from all checklists
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
      // default: prefill from checklist detail's responsibleEmployeeId
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
          status: existing?.status ?? 'Pending',
          employeePreboardingChecklistId:
            existing?.employeePreboardingChecklistId ?? null,
        },
      }
    })
  }

  const updateField = (
    id: number,
    field: keyof SelectedChecklistDetail,
    value: string | number
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

  // Group details by checklist master name
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
      <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
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
            {/* Group header */}
            <div className="bg-blue-50 px-4 py-2 border-b">
              <span className="font-semibold text-sm text-blue-800">
                {group.masterName}
              </span>
            </div>

            {/* Details table */}
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
                    Responsible
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
                      className={`border-t transition-colors ${
                        isChecked ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleDetail(detail)}
                        />
                      </td>

                      {/* Task name */}
                      <td className="px-3 py-2 text-gray-800">
                        {detail.checklistDetailsName}
                      </td>

                      {/* Responsible employee */}
                      <td className="px-3 py-2">
                        {isChecked ? (
                          <select
                            className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                            value={sel.responsibleEmployeeId}
                            onChange={(e) =>
                              updateField(
                                detail.checklistDetailsId,
                                'responsibleEmployeeId',
                                Number(e.target.value)
                              )
                            }
                          >
                            <option value={0}>— Select —</option>
                            {employees?.map((emp) => (
                              <option
                                key={emp.employeeId}
                                value={emp.employeeId!}
                              >
                                {emp.empCode} - {emp.empFullName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            {detail.responsibleEmployeeName ?? '—'}
                          </span>
                        )}
                      </td>

                      {/* Completion date */}
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

                      {/* Status */}
                      <td className="px-3 py-2">
                        {isChecked ? (
                          <select
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                            value={sel.status}
                            onChange={(e) =>
                              updateField(
                                detail.checklistDetailsId,
                                'status',
                                e.target.value
                              )
                            }
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
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

      {/* Footer */}
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

// ─── Main Component ───────────────────────────────────────────────────────────

const EmployeePreboardings = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: preboardings } = useGetAllEmployeePreboardings()
  const { data: checklists } = useGetChecklists()
  const { data: companies } = useGetCompanies()
  const { data: departments } = useGetDepartments()
  const { data: designations } = useGetDesignations()
  const { data: employees } = useGetAllEmployees()
  const { data: employmentTypes } = useGetEmploymentTypes()
  const { data: salaryStructures } = useGetSalaryStructures()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [preboardingsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetEmployeePreboardingType>('fullName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingPreboardingId, setEditingPreboardingId] = useState<
    number | null
  >(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingPreboardingId, setDeletingPreboardingId] = useState<
    number | null
  >(null)

  // ── Checklist popup state ──────────────────────────────────────────────────
  const [isChecklistPopupOpen, setIsChecklistPopupOpen] = useState(false)
  const [activePreboarding, setActivePreboarding] =
    useState<GetEmployeePreboardingType | null>(null)

  // Fetch existing checklist assignments for the active preboarding
  const { data: existingChecklistData } =
    useGetPreboardingEmployeeChecklistsById(
      activePreboarding?.preboardingId ?? 0
    )

  const existingAssignments: GetEmployeePreboardingChecklistType[] | undefined =
    existingChecklistData?.data

  const closeChecklistPopup = useCallback(() => {
    setIsChecklistPopupOpen(false)
    setActivePreboarding(null)
  }, [])

  const addChecklistMutation = useAddPreboardingEmployeeChecklists({
    onClose: closeChecklistPopup,
    reset: closeChecklistPopup,
  })

  const handleChecklistSave = useCallback(
    (bulk: CreateEmployeePreboardingChecklistType[]) => {
      // Always call the "add/upsert" endpoint with the full array.
      // Adjust to updateMutation if your backend distinguishes create vs update.
      addChecklistMutation.mutate(bulk as any)
    },
    [addChecklistMutation]
  )

  // ── Preboarding form ───────────────────────────────────────────────────────

  const defaultForm = useCallback<any>(
    () => ({
      fullName: '',
      gender: 'Male' as 'Male' | 'Female',
      dob: '',
      personalEmail: '',
      personalPhone: '',
      tentativeJoiningDate: '',
      companyId: 0,
      departmentId: 0,
      designationId: 0,
      reportingAuthorityId: 0,
      employmentTypeId: 0,
      salaryStructureMasterId: 0,
      offeredSalary: 0,
      probationMonths: 0,
      status: 'Active',
      createdBy: userData?.userId || 0,
    }),
    [userData?.userId]
  )

  const [formData, setFormData] =
    useState<CreateEmployeePreboardingType>(defaultForm)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (
    name: keyof CreateEmployeePreboardingType,
    value: string
  ) => {
    const parsed = value === '0' || value === '' ? 0 : Number(value)
    setFormData((prev) => ({ ...prev, [name]: parsed }))
  }

  const resetForm = useCallback(() => {
    setFormData({ ...defaultForm(), createdBy: userData?.userId || 0 })
    setEditingPreboardingId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId, defaultForm])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useCreateEmployeePreboarding({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useEditEmployeePreboarding({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteEmployeePreboarding({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetEmployeePreboardingType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredPreboardings = useMemo(() => {
    if (!preboardings?.data) return []
    return preboardings.data.filter((p: GetEmployeePreboardingType) =>
      p.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [preboardings?.data, searchTerm])

  const sortedPreboardings = useMemo(() => {
    return [...filteredPreboardings].sort(
      (a: GetEmployeePreboardingType, b: GetEmployeePreboardingType) => {
        const aValue = a.fullName ?? ''
        const bValue = b.fullName ?? ''
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
    )
  }, [filteredPreboardings, sortDirection])

  const paginatedPreboardings = useMemo(() => {
    const startIndex = (currentPage - 1) * preboardingsPerPage
    return sortedPreboardings.slice(
      startIndex,
      startIndex + preboardingsPerPage
    )
  }, [sortedPreboardings, currentPage, preboardingsPerPage])

  const totalPages = Math.ceil(sortedPreboardings.length / preboardingsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      try {
        const submitData: CreateEmployeePreboardingType = { ...formData }
        if (isEditMode) {
          submitData.updatedBy = userData?.userId || 0
        } else {
          submitData.createdBy = userData?.userId || 0
        }

        if (isEditMode && editingPreboardingId) {
          updateMutation.mutate({
            id: editingPreboardingId,
            data: submitData as GetEmployeePreboardingType,
          })
        } else {
          addMutation.mutate(submitData)
        }
      } catch (err) {
        setError('Failed to save employee preboarding')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingPreboardingId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving employee preboarding')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (preboarding: GetEmployeePreboardingType) => {
    setFormData({
      fullName: preboarding.fullName,
      gender: preboarding.gender,
      dob: preboarding.dob,
      personalEmail: preboarding.personalEmail,
      personalPhone: preboarding.personalPhone,
      tentativeJoiningDate: preboarding.tentativeJoiningDate,
      companyId: preboarding.companyId ?? 0,
      departmentId: preboarding.departmentId ?? 0,
      designationId: preboarding.designationId ?? 0,
      reportingAuthorityId: preboarding.reportingAuthorityId ?? 0,
      employmentTypeId: preboarding.employmentTypeId ?? 0,
      salaryStructureMasterId: preboarding.salaryStructureMasterId ?? 0,
      offeredSalary: preboarding.offeredSalary ?? 0,
      probationMonths: preboarding.probationMonths ?? 0,
      status: preboarding.status ?? 'Active',
      createdBy: userData?.userId || 0,
    })
    setEditingPreboardingId(preboarding.preboardingId!)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  const handleChecklistClick = (preboarding: GetEmployeePreboardingType) => {
    setActivePreboarding(preboarding)
    setIsChecklistPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <ClipboardList className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Employee Preboardings</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search preboardings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-blue-400 hover:bg-blue-500 text-black"
            onClick={() => setIsPopupOpen(true)}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead>Preboard No.</TableHead>
              <TableHead
                onClick={() => handleSort('fullName')}
                className="cursor-pointer"
              >
                Full Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Tentative Joining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!preboardings || preboardings.data === undefined ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  Loading preboardings...
                </TableCell>
              </TableRow>
            ) : !preboardings.data || preboardings.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No preboardings found
                </TableCell>
              </TableRow>
            ) : paginatedPreboardings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No preboardings match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedPreboardings?.map(
                (preboarding: GetEmployeePreboardingType, index: number) => (
                  <TableRow key={preboarding.preboardingId ?? index}>
                    <TableCell>
                      {(currentPage - 1) * preboardingsPerPage + index + 1}
                    </TableCell>
                    <TableCell>{preboarding.preboardNo ?? '—'}</TableCell>
                    <TableCell className="font-medium">
                      {preboarding.fullName}
                    </TableCell>
                    <TableCell>{preboarding.gender ?? '—'}</TableCell>
                    <TableCell>{preboarding.departmentName ?? '—'}</TableCell>
                    <TableCell>{preboarding.designationName ?? '—'}</TableCell>
                    <TableCell>
                      {preboarding.tentativeJoiningDate
                        ? new Date(
                            preboarding.tentativeJoiningDate
                          ).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          preboarding.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {preboarding.status ?? 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Checklist (check) button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          title="Assign Checklists"
                          onClick={() => handleChecklistClick(preboarding)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>

                        {/* Edit button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit Preboarding"
                          onClick={() => handleEditClick(preboarding)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          title="Delete Preboarding"
                          onClick={() => {
                            setDeletingPreboardingId(preboarding.preboardingId!)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </div>

      {sortedPreboardings.length > 0 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className={
                    currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, index) => {
                if (
                  index === 0 ||
                  index === totalPages - 1 ||
                  (index >= currentPage - 2 && index <= currentPage + 2)
                ) {
                  return (
                    <PaginationItem key={`page-${index}`}>
                      <PaginationLink
                        onClick={() => setCurrentPage(index + 1)}
                        isActive={currentPage === index + 1}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                } else if (
                  index === currentPage - 3 ||
                  index === currentPage + 3
                ) {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationLink>...</PaginationLink>
                    </PaginationItem>
                  )
                }
                return null
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* ── Add/Edit Preboarding Popup ────────────────────────────────────── */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={
          isEditMode ? 'Edit Employee Preboarding' : 'Add Employee Preboarding'
        }
        size="sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName ?? ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">
                Gender <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={[
                  { id: 'Male', name: 'Male' },
                  { id: 'Female', name: 'Female' },
                ]}
                value={
                  formData.gender
                    ? { id: formData.gender, name: formData.gender }
                    : null
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    gender: (value?.id as 'Male' | 'Female') ?? 'Male',
                  }))
                }
                placeholder="Select gender"
              />
            </div>

            {/* Date of Birth */}
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

            {/* Tentative Joining Date */}
            <div className="space-y-2">
              <Label htmlFor="tentativeJoiningDate">
                Tentative Joining Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tentativeJoiningDate"
                name="tentativeJoiningDate"
                type="date"
                value={formData.tentativeJoiningDate ?? ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Personal Email */}
            <div className="space-y-2">
              <Label htmlFor="personalEmail">
                Personal Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="personalEmail"
                name="personalEmail"
                type="email"
                value={formData.personalEmail ?? ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Personal Phone */}
            <div className="space-y-2">
              <Label htmlFor="personalPhone">
                Personal Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="personalPhone"
                name="personalPhone"
                value={formData.personalPhone ?? ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="companyId">Company</Label>
              <CustomCombobox
                items={
                  companies?.data?.map((company: GetCompanyType) => ({
                    id: company.companyId!.toString(),
                    name: company.companyName,
                  })) || []
                }
                value={
                  formData.companyId
                    ? {
                        id: formData.companyId.toString(),
                        name:
                          companies?.data?.find(
                            (c: GetCompanyType) =>
                              c.companyId === formData.companyId
                          )?.companyName ?? formData.companyId.toString(),
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

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <CustomCombobox
                items={
                  departments?.data?.map((dept: GetDepartmentType) => ({
                    id: dept.departmentId!.toString(),
                    name: dept.departmentName,
                  })) || []
                }
                value={
                  formData.departmentId
                    ? {
                        id: formData.departmentId.toString(),
                        name:
                          departments?.data?.find(
                            (d: GetDepartmentType) =>
                              d.departmentId === formData.departmentId
                          )?.departmentName ?? formData.departmentId.toString(),
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

            {/* Designation */}
            <div className="space-y-2">
              <Label htmlFor="designationId">Designation</Label>
              <CustomCombobox
                items={
                  designations?.data?.map((d: GetDesignationType) => ({
                    id: d.designationId!.toString(),
                    name: d.designationName,
                  })) || []
                }
                value={
                  formData.designationId
                    ? {
                        id: formData.designationId.toString(),
                        name:
                          designations?.data?.find(
                            (d: GetDesignationType) =>
                              d.designationId === formData.designationId
                          )?.designationName ??
                          formData.designationId.toString(),
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

            {/* Reporting Authority */}
            <div className="space-y-2">
              <Label htmlFor="reportingAuthorityId">Reporting Authority</Label>
              <CustomCombobox
                items={
                  employees?.data?.map((emp: GetEmployeeType) => ({
                    id: emp.employeeId!.toString(),
                    name: `${emp.empCode ?? ''} - ${emp.empFullName ?? ''}`.trim(),
                  })) || []
                }
                value={
                  formData.reportingAuthorityId
                    ? {
                        id: formData.reportingAuthorityId.toString(),
                        name: (() => {
                          const matched = employees?.data?.find(
                            (emp: GetEmployeeType) =>
                              emp.employeeId === formData.reportingAuthorityId
                          )
                          return matched
                            ? `${matched.empCode ?? ''} - ${matched.empFullName ?? ''}`.trim()
                            : formData.reportingAuthorityId.toString()
                        })(),
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

            {/* Employment Type */}
            <div className="space-y-2">
              <Label htmlFor="employmentTypeId">Employment Type</Label>
              <CustomCombobox
                items={
                  employmentTypes?.data?.map((et: GetEmploymentTypeType) => ({
                    id: et.employmentTypeId!.toString(),
                    name: et.employmentTypeName,
                  })) || []
                }
                value={
                  formData.employmentTypeId
                    ? {
                        id: formData.employmentTypeId.toString(),
                        name:
                          employmentTypes?.data?.find(
                            (et: GetEmploymentTypeType) =>
                              et.employmentTypeId === formData.employmentTypeId
                          )?.employmentTypeName ??
                          formData.employmentTypeId.toString(),
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'employmentTypeId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select employment type"
              />
            </div>

            {/* Salary Structure */}
            <div className="space-y-2">
              <Label htmlFor="salaryStructureMasterId">Salary Structure</Label>
              <CustomCombobox
                items={
                  salaryStructures?.data?.map((ss: GetSalaryStructureType) => ({
                    id: ss.salaryStructureMaster.salaryStructureMasterId!.toString(),
                    name: ss.salaryStructureMaster.structureName,
                  })) || []
                }
                value={
                  formData.salaryStructureMasterId
                    ? {
                        id: formData.salaryStructureMasterId.toString(),
                        name:
                          salaryStructures?.data?.find(
                            (ss: GetSalaryStructureType) =>
                              ss.salaryStructureMaster
                                .salaryStructureMasterId ===
                              formData.salaryStructureMasterId
                          )?.salaryStructureMaster.structureName ??
                          formData.salaryStructureMasterId.toString(),
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

            {/* Offered Salary */}
            <div className="space-y-2">
              <Label htmlFor="offeredSalary">Offered Salary</Label>
              <Input
                id="offeredSalary"
                name="offeredSalary"
                type="number"
                value={formData.offeredSalary ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    offeredSalary:
                      e.target.value === '' ? 0 : Number(e.target.value),
                  }))
                }
              />
            </div>

            {/* Probation Months */}
            <div className="space-y-2">
              <Label htmlFor="probationMonths">Probation Months</Label>
              <Input
                id="probationMonths"
                name="probationMonths"
                type="number"
                value={formData.probationMonths ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    probationMonths:
                      e.target.value === '' ? 0 : Number(e.target.value),
                  }))
                }
              />
            </div>

            {/* Status */}
            <div className="space-y-2 col-span-2">
              <CustomSwitch
                label="Status"
                checked={formData.status === 'Active'}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value ? 'Active' : 'Inactive',
                  }))
                }
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closePopup}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {addMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : 'Save'}
            </Button>
          </div>
        </form>
      </Popup>

      {/* ── Checklist Assignment Popup ────────────────────────────────────── */}
      <ChecklistPopup
        isOpen={isChecklistPopupOpen}
        onClose={closeChecklistPopup}
        preboarding={activePreboarding}
        checklists={checklists?.data}
        employees={employees?.data}
        existingAssignments={existingAssignments}
        userId={userData?.userId ?? 0}
        onSave={handleChecklistSave}
        isSaving={addChecklistMutation.isPending}
      />

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee Preboarding</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this preboarding record? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingPreboardingId) {
                  deleteMutation.mutate({ id: deletingPreboardingId })
                }
                setIsDeleteDialogOpen(false)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default EmployeePreboardings
