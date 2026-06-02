'use client'

import React from 'react'
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
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateChecklistType,
  GetChecklistType,
  GetEmployeeType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetChecklists,
  useAddChecklists,
  useUpdateChecklists,
  useDeleteChecklists,
  useGetAllEmployees,
  useCompleteChecklist,
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

const defaultChecklistMaster: CreateChecklistType['checklistMaster'] = {
  checklistName: '',
  heading: '',
  responsibleEmployeeId: 0,
  createdBy: 0,
  createdAt: new Date(),
  updatedBy: null,
  updatedAt: null,
}

const defaultFormData: CreateChecklistType = {
  checklistMaster: defaultChecklistMaster,
  checklistDetails: [],
}

const Checklists = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: checklists } = useGetChecklists()
  console.log('🚀 ~ Checklists ~ checklists:', checklists)
  const { data: employees } = useGetAllEmployees()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [checklistsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetChecklistType['checklistMaster']>('checklistName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingChecklistId, setEditingChecklistId] = useState<number | null>(
    null
  )

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [completingChecklistId, setCompletingChecklistId] = useState<
    number | null
  >(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingChecklistId, setDeletingChecklistId] = useState<number | null>(
    null
  )
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRowExpand = (checklistId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      next.has(checklistId) ? next.delete(checklistId) : next.add(checklistId)
      return next
    })
  }

  const [formData, setFormData] = useState<CreateChecklistType>(defaultFormData)

  // ─── ChecklistMaster field helpers ───────────────────────────────────────

  const handleMasterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      checklistMaster: { ...prev.checklistMaster, [name]: value },
    }))
  }

  // ─── ChecklistDetails helpers ─────────────────────────────────────────────

  const handleAddDetail = () => {
    const newDetail: CreateChecklistType['checklistDetails'][number] = {
      checklistDetailsName: '',
      checklistMasterId: null,
      responsibleEmployeeId:
        formData.checklistMaster.responsibleEmployeeId || 0,
      createdBy: userData?.userId || 0,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    }
    setFormData((prev) => ({
      ...prev,
      checklistDetails: [...prev.checklistDetails, newDetail],
    }))
  }

  // ─── Reset / Close ────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormData({
      ...defaultFormData,
      checklistMaster: {
        ...defaultChecklistMaster,
        createdBy: userData?.userId || 0,
      },
    })
    setEditingChecklistId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  // ─── Mutations ────────────────────────────────────────────────────────────

  const addMutation = useAddChecklists({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateChecklists({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteChecklists({
    onClose: closePopup,
    reset: resetForm,
  })

  const completeMutation = useCompleteChecklist({
    onClose: closePopup,
    reset: resetForm,
  })

  // ─── Sorting / Filtering / Pagination ────────────────────────────────────

  const handleSort = (column: keyof GetChecklistType['checklistMaster']) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredChecklists = useMemo(() => {
    if (!checklists?.data) return []
    const list = Array.isArray(checklists.data)
      ? checklists.data
      : [checklists.data]
    return list.filter(
      (item: any) =>
        item.checklistMaster?.checklistName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.checklistMaster?.heading
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.checklistMaster?.responsibleEmployeeName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
    )
  }, [checklists?.data, searchTerm])

  const sortedChecklists = useMemo(() => {
    return [...filteredChecklists].sort((a: any, b: any) => {
      const aValue = a.checklistMaster?.[sortColumn] ?? ''
      const bValue = b.checklistMaster?.[sortColumn] ?? ''
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      return 0
    })
  }, [filteredChecklists, sortColumn, sortDirection])

  const paginatedChecklists = useMemo(() => {
    const startIndex = (currentPage - 1) * checklistsPerPage
    return sortedChecklists.slice(startIndex, startIndex + checklistsPerPage)
  }, [sortedChecklists, currentPage, checklistsPerPage])

  const totalPages = Math.ceil(sortedChecklists.length / checklistsPerPage)

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!formData.checklistMaster.checklistName.trim()) {
        setError('Checklist name is required')
        return
      }
      if (!formData.checklistMaster.responsibleEmployeeId) {
        setError('Please select a responsible employee')
        return
      }
      if (formData.checklistDetails.length === 0) {
        setError('Please add at least one checklist detail')
        return
      }
      const hasInvalidName = formData.checklistDetails.some(
        (d) => !d.checklistDetailsName.trim()
      )
      if (hasInvalidName) {
        setError('Please provide a name for all checklist details')
        return
      }

      try {
        if (isEditMode && editingChecklistId) {
          const updateData: GetChecklistType = {
            checklistMaster: {
              ...formData.checklistMaster,
              updatedBy: userData?.userId || 0,
              updatedAt: new Date(),
            },
            checklistDetails: formData.checklistDetails,
          }
          updateMutation.mutate({ id: editingChecklistId, data: updateData })
        } else {
          const createData: CreateChecklistType = {
            checklistMaster: {
              ...formData.checklistMaster,
              createdBy: userData?.userId || 0,
              createdAt: new Date(),
            },
            checklistDetails: formData.checklistDetails.map((d) => ({
              ...d,
              createdBy: userData?.userId || 0,
              createdAt: new Date(),
            })),
          }
          addMutation.mutate(createData)
        }
      } catch (err) {
        setError('Failed to save checklist')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingChecklistId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving checklist')
    }
  }, [addMutation.error, updateMutation.error])

  // ─── Edit handler ─────────────────────────────────────────────────────────

  const handleEditClick = (item: any) => {
    setIsEditMode(true)
    setEditingChecklistId(item.checklistMaster?.checklistMasterId || null)
    setFormData({
      checklistMaster: {
        ...item.checklistMaster,
        updatedBy: userData?.userId || 0,
      },
      checklistDetails: item.checklistDetails || [],
    })
    setIsPopupOpen(true)
  }

  // ─── Format date helper ───────────────────────────────────────────────────

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <ClipboardList className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Checklists</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search checklists..."
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

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead
                onClick={() => handleSort('checklistName')}
                className="cursor-pointer"
              >
                Checklist Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('heading')}
                className="cursor-pointer"
              >
                Heading <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Responsible Employee</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!checklists || checklists.data === undefined ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Loading checklists...
                </TableCell>
              </TableRow>
            ) : !checklists.data || checklists.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No checklists found
                </TableCell>
              </TableRow>
            ) : paginatedChecklists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No checklists match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedChecklists.map((item: any, index: number) => {
                const checklistId = item.checklistMaster?.checklistMasterId
                const isExpanded = expandedRows.has(checklistId)
                const details: any[] = item.checklistDetails || []

                return (
                  <React.Fragment key={`fragment-${checklistId ?? index}`}>
                    <TableRow
                      className="cursor-pointer hover:bg-blue-50"
                      onClick={() => toggleRowExpand(checklistId)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          {(currentPage - 1) * checklistsPerPage + index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.checklistMaster?.checklistName}
                      </TableCell>
                      <TableCell>
                        {item.checklistMaster?.heading || '—'}
                      </TableCell>
                      <TableCell>
                        {item.checklistMaster?.responsibleEmployeeName || 'N/A'}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-2">
                          {/* Complete */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={
                              userData?.userId !== item.checklistMaster?.userId
                            }
                            onClick={() => {
                              setCompletingChecklistId(
                                item.checklistMaster?.checklistMasterId || null
                              )
                              setIsCompleteDialogOpen(true)
                            }}
                          >
                            Complete
                          </Button>

                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => handleEditClick(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setDeletingChecklistId(
                                item.checklistMaster?.checklistMasterId || null
                              )
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow
                        key={`expand-${index}`}
                        className="bg-blue-50/40"
                      >
                        <TableCell colSpan={5} className="py-3 px-6">
                          <div className="text-xs font-semibold text-gray-500 mb-2">
                            Checklist Details
                          </div>
                          <div className="space-y-1">
                            {details.length === 0 ? (
                              <p className="text-xs text-gray-400">
                                No checklist details found.
                              </p>
                            ) : (
                              details.map((d: any, detailIdx: number) => (
                                <div
                                  key={
                                    d.checklistDetailsId ??
                                    `detail-${detailIdx}`
                                  }
                                  className="flex items-center gap-4 text-xs border rounded px-3 py-1.5 bg-white"
                                >
                                  <span className="font-medium w-40">
                                    {d.checklistDetailsName || '—'}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {sortedChecklists.length > 0 && (
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

      {/* Add / Edit Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Checklist' : 'Add Checklist'}
        size="sm:max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* ── Checklist Master Info ── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Checklist Name */}
            <div className="space-y-2">
              <Label htmlFor="checklistName">
                Checklist Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="checklistName"
                name="checklistName"
                value={formData.checklistMaster.checklistName}
                onChange={handleMasterChange}
                placeholder="e.g. Onboarding Checklist"
                required
              />
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <Label htmlFor="heading">Heading</Label>
              <Input
                id="heading"
                name="heading"
                value={formData.checklistMaster.heading ?? ''}
                onChange={handleMasterChange}
                placeholder="e.g. New Employee Onboarding"
              />
            </div>

            {/* Responsible Employee — CustomCombobox (foreign key) */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="responsibleEmployeeId">
                Responsible Employee <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  employees?.data?.map((emp: GetEmployeeType) => ({
                    id: emp.employeeId?.toString() ?? '',
                    name: emp.empFullName,
                  })) || []
                }
                value={
                  formData.checklistMaster.responsibleEmployeeId
                    ? {
                        id: formData.checklistMaster.responsibleEmployeeId.toString(),
                        name:
                          employees?.data?.find(
                            (emp: GetEmployeeType) =>
                              emp.employeeId ===
                              formData.checklistMaster.responsibleEmployeeId
                          )?.empFullName ||
                          formData.checklistMaster.responsibleEmployeeId.toString(),
                      }
                    : null
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    checklistMaster: {
                      ...prev.checklistMaster,
                      responsibleEmployeeId: value ? Number(value.id) : 0,
                    },
                    checklistDetails: prev.checklistDetails.map((d) => ({
                      ...d,
                      responsibleEmployeeId: value ? Number(value.id) : 0,
                    })),
                  }))
                }
                placeholder="Select responsible employee"
              />
            </div>
          </div>

          {/* ── Checklist Details ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">
                Checklist Details <span className="text-red-500">*</span>
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-400 hover:bg-blue-50"
                onClick={handleAddDetail}
              >
                + Add Detail
              </Button>
            </div>
            <div className="space-y-2">
              {formData.checklistDetails.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4 border rounded-md">
                  No details added yet. Click &quot;+ Add Detail&quot; to begin.
                </p>
              ) : (
                formData.checklistDetails.map((detail, idx) => (
                  <div key={`detail-${idx}`} className="border rounded-md p-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Detail Name */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400">
                          Detail Name
                        </span>
                        <Input
                          className="h-8 text-xs w-48"
                          placeholder="e.g. Submit documents"
                          value={detail.checklistDetailsName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              checklistDetails: prev.checklistDetails.map(
                                (d, i) =>
                                  i === idx
                                    ? {
                                        ...d,
                                        checklistDetailsName: e.target.value,
                                      }
                                    : d
                              ),
                            }))
                          }
                        />
                      </div>

                      {/* Remove button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 ml-auto self-end"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            checklistDetails: prev.checklistDetails.filter(
                              (_, i) => i !== idx
                            ),
                          }))
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
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

      {/* Delete Confirm */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checklist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this checklist? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingChecklistId) {
                  deleteMutation.mutate({ id: deletingChecklistId })
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

      <AlertDialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Checklist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this checklist as complete? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsCompleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (completingChecklistId) {
                  completeMutation.mutate({
                    checklistMasterId: completingChecklistId,
                  })
                }
                setIsCompleteDialogOpen(false)
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Complete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Checklists
