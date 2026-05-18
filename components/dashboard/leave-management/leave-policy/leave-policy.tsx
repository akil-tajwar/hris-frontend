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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowUpDown,
  Search,
  FileText,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateLeavePolicyType, GetLeavePolicyType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetLeavePolicies,
  useAddLeavePolicys,
  useUpdateLeavePolicy,
  useDeleteLeavePolicys,
  useGetCompanies,
  useGetLeaveTypes,
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

// Accrual frequency options matching the schema enum
const ACCRUAL_FREQUENCY_OPTIONS = ['Monthly', 'Quarterly', 'Yearly'] as const
type AccrualFrequency = (typeof ACCRUAL_FREQUENCY_OPTIONS)[number]

const defaultLeavePolicyMaster: CreateLeavePolicyType['leavePolicyMaster'] = {
  companyId: 0,
  policyName: '',
  effectiveFrom: new Date(),
  effectiveTo: null,
  description: null,
  active: true,
  createdBy: 0,
  createdAt: new Date(),
  updatedBy: null,
  updatedAt: null,
}

const defaultFormData: CreateLeavePolicyType = {
  leavePolicyMaster: defaultLeavePolicyMaster,
  leavePolicyDetails: [],
}

const LeavePolicy = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: leavePolicy } = useGetLeavePolicies()
  const { data: companies } = useGetCompanies()
  const { data: leaveTypes } = useGetLeaveTypes()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [policiesPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetLeavePolicyType['leavePolicyMaster']>('policyName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingPolicyId, setEditingPolicyId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingPolicyId, setDeletingPolicyId] = useState<number | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRowExpand = (policyId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      next.has(policyId) ? next.delete(policyId) : next.add(policyId)
      return next
    })
  }

  const [formData, setFormData] =
    useState<CreateLeavePolicyType>(defaultFormData)

  // ─── LeavePolicyMaster field helpers ─────────────────────────────────────

  const handleMasterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      leavePolicyMaster: { ...prev.leavePolicyMaster, [name]: value },
    }))
  }

  const handleMasterSelectChange = (
    field: keyof CreateLeavePolicyType['leavePolicyMaster'],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      leavePolicyMaster: { ...prev.leavePolicyMaster, [field]: value },
    }))
  }

  const handleMasterSwitchChange = (
    field: keyof CreateLeavePolicyType['leavePolicyMaster'],
    value: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      leavePolicyMaster: { ...prev.leavePolicyMaster, [field]: value },
      ...(field === 'active' && {
        leavePolicyDetails: prev.leavePolicyDetails.map((d) => ({
          ...d,
          active: value,
        })),
      }),
    }))
  }

  // ─── LeavePolicyDetails helpers ───────────────────────────────────────────

  const handleDetailFieldChange = (
    leaveTypeId: number,
    field: keyof CreateLeavePolicyType['leavePolicyDetails'][number],
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      leavePolicyDetails: prev.leavePolicyDetails.map((d) =>
        d.leaveTypeId === leaveTypeId ? { ...d, [field]: value } : d
      ),
    }))
  }

  const handleAddDetail = () => {
    const newDetail: CreateLeavePolicyType['leavePolicyDetails'][number] = {
      leavePolicyMasterId: 0,
      leaveTypeId: 0,
      yearlyAllocation: 0,
      accrualFrequency: 'Monthly',
      accrualRate: 0,
      maxBalanceAllowed: 0,
      carryForwardLimit: 0,
      active: formData.leavePolicyMaster.active,
      createdBy: userData?.userId || 0,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    }
    setFormData((prev) => ({
      ...prev,
      leavePolicyDetails: [...prev.leavePolicyDetails, newDetail],
    }))
  }

  const handleRemoveDetail = (leaveTypeId: number) => {
    setFormData((prev) => ({
      ...prev,
      leavePolicyDetails: prev.leavePolicyDetails.filter(
        (d) => d.leaveTypeId !== leaveTypeId
      ),
    }))
  }

  // ─── Reset / Close ────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormData({
      ...defaultFormData,
      leavePolicyMaster: {
        ...defaultLeavePolicyMaster,
        createdBy: userData?.userId || 0,
      },
    })
    setEditingPolicyId(null)
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

  const addMutation = useAddLeavePolicys({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateLeavePolicy({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteLeavePolicys({
    onClose: closePopup,
    reset: resetForm,
  })

  // ─── Sorting / Filtering / Pagination ────────────────────────────────────

  const handleSort = (
    column: keyof GetLeavePolicyType['leavePolicyMaster']
  ) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredPolicies = useMemo(() => {
    if (!leavePolicy?.data) return []
    const list = Array.isArray(leavePolicy.data)
      ? leavePolicy.data
      : [leavePolicy.data]
    return list.filter(
      (item: any) =>
        item.leavePolicyMaster?.policyName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.leavePolicyMaster?.companyName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.leavePolicyMaster?.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
    )
  }, [leavePolicy?.data, searchTerm])

  const sortedPolicies = useMemo(() => {
    return [...filteredPolicies].sort((a: any, b: any) => {
      const aValue = a.leavePolicyMaster?.[sortColumn] ?? ''
      const bValue = b.leavePolicyMaster?.[sortColumn] ?? ''
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      return 0
    })
  }, [filteredPolicies, sortColumn, sortDirection])

  const paginatedPolicies = useMemo(() => {
    const startIndex = (currentPage - 1) * policiesPerPage
    return sortedPolicies.slice(startIndex, startIndex + policiesPerPage)
  }, [sortedPolicies, currentPage, policiesPerPage])

  const totalPages = Math.ceil(sortedPolicies.length / policiesPerPage)

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!formData.leavePolicyMaster.companyId) {
        setError('Please select a company')
        return
      }
      if (!formData.leavePolicyMaster.policyName.trim()) {
        setError('Policy name is required')
        return
      }
      if (!formData.leavePolicyMaster.effectiveFrom) {
        setError('Effective from date is required')
        return
      }
      if (formData.leavePolicyDetails.length === 0) {
        setError('Please add at least one leave policy detail')
        return
      }
      const hasInvalidLeaveType = formData.leavePolicyDetails.some(
        (d) => !d.leaveTypeId
      )
      if (hasInvalidLeaveType) {
        setError('Please select a leave type for all policy details')
        return
      }

      try {
        if (isEditMode && editingPolicyId) {
          const updateData: GetLeavePolicyType = {
            leavePolicyMaster: {
              ...formData.leavePolicyMaster,
              updatedBy: userData?.userId || 0,
              updatedAt: new Date(),
            },
            leavePolicyDetails: formData.leavePolicyDetails,
          }
          updateMutation.mutate({ id: editingPolicyId, data: updateData })
        } else {
          const createData: CreateLeavePolicyType = {
            leavePolicyMaster: {
              ...formData.leavePolicyMaster,
              createdBy: userData?.userId || 0,
              createdAt: new Date(),
            },
            leavePolicyDetails: formData.leavePolicyDetails.map((d) => ({
              ...d,
              createdBy: userData?.userId || 0,
              createdAt: new Date(),
            })),
          }
          addMutation.mutate(createData)
        }
      } catch (err) {
        setError('Failed to save leave policy')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingPolicyId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving leave policy')
    }
  }, [addMutation.error, updateMutation.error])

  // ─── Edit handler ─────────────────────────────────────────────────────────

  const handleEditClick = (item: any) => {
    setIsEditMode(true)
    setEditingPolicyId(item.leavePolicyMaster?.leavePolicyMasterId || null)
    setFormData({
      leavePolicyMaster: {
        ...item.leavePolicyMaster,
        updatedBy: userData?.userId || 0,
      },
      leavePolicyDetails: item.leavePolicyDetails || [],
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

  const toInputDate = (date: Date | string | null | undefined) => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <FileText className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Leave Policy</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-amber-400 hover:bg-amber-500 text-black"
            onClick={() => setIsPopupOpen(true)}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead
                onClick={() => handleSort('policyName')}
                className="cursor-pointer"
              >
                Policy Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead
                onClick={() => handleSort('effectiveFrom')}
                className="cursor-pointer"
              >
                Effective From <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('effectiveTo')}
                className="cursor-pointer"
              >
                Effective To <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!leavePolicy || leavePolicy.data === undefined ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Loading leave policies...
                </TableCell>
              </TableRow>
            ) : !leavePolicy.data || leavePolicy.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No leave policies found
                </TableCell>
              </TableRow>
            ) : paginatedPolicies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No leave policies match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedPolicies.map((item: any, index: number) => {
                const policyId = item.leavePolicyMaster?.leavePolicyMasterId
                const isExpanded = expandedRows.has(policyId)
                const details: any[] = item.leavePolicyDetails || []

                return (
                  <React.Fragment key={`fragment-${policyId ?? index}`}>
                    <TableRow
                      className="cursor-pointer hover:bg-amber-50"
                      onClick={() => toggleRowExpand(policyId)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          {(currentPage - 1) * policiesPerPage + index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.leavePolicyMaster?.policyName}
                      </TableCell>
                      <TableCell>
                        {item.leavePolicyMaster?.companyName || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {formatDate(item.leavePolicyMaster?.effectiveFrom)}
                      </TableCell>
                      <TableCell>
                        {formatDate(item.leavePolicyMaster?.effectiveTo)}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-gray-500 text-sm">
                        {item.leavePolicyMaster?.description || '—'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.leavePolicyMaster?.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.leavePolicyMaster?.active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-600 hover:text-amber-700"
                            onClick={() => handleEditClick(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setDeletingPolicyId(
                                item.leavePolicyMaster?.leavePolicyMasterId ||
                                  null
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
                        className="bg-amber-50/40"
                      >
                        <TableCell colSpan={8} className="py-3 px-6">
                          <div className="text-xs font-semibold text-gray-500 mb-2">
                            Leave Policy Details
                          </div>
                          <div className="space-y-1">
                            {details.length === 0 ? (
                              <p className="text-xs text-gray-400">
                                No policy details found.
                              </p>
                            ) : (
                              details.map((d: any) => (
                                <div
                                  key={d.leavePolicyDetailsId ?? d.leaveTypeId}
                                  className="flex items-center gap-4 text-xs border rounded px-3 py-1.5 bg-white"
                                >
                                  <span className="font-medium w-32">
                                    {d.leaveTypeName ||
                                      `Type #${d.leaveTypeId}`}
                                  </span>
                                  <span className="text-gray-500">
                                    Accrual:{' '}
                                    <span className="text-gray-800">
                                      {d.accrualFrequency}
                                    </span>
                                  </span>
                                  <span className="text-gray-500">
                                    Rate:{' '}
                                    <span className="text-gray-800">
                                      {d.accrualRate}
                                    </span>
                                  </span>
                                  <span className="text-gray-500">
                                    Yearly Alloc:{' '}
                                    <span className="text-gray-800">
                                      {d.yearlyAllocation}
                                    </span>
                                  </span>
                                  <span className="text-gray-500">
                                    Max Balance:{' '}
                                    <span className="text-gray-800">
                                      {d.maxBalanceAllowed}
                                    </span>
                                  </span>
                                  <span className="text-gray-500">
                                    Carry Fwd:{' '}
                                    <span className="text-gray-800">
                                      {d.carryForwardLimit}
                                    </span>
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-medium ${
                                      d.active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {d.active ? 'Active' : 'Inactive'}
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
      {sortedPolicies.length > 0 && (
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
        title={isEditMode ? 'Edit Leave Policy' : 'Add Leave Policy'}
        size="sm:max-w-5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* ── Policy Master Info ── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Company — CustomCombobox (foreign key) */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="companyId">
                Company <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  companies?.data?.map((c: any) => ({
                    id: c.companyId.toString(),
                    name: c.companyName,
                  })) || []
                }
                value={
                  formData.leavePolicyMaster.companyId
                    ? {
                        id: formData.leavePolicyMaster.companyId.toString(),
                        name:
                          companies?.data?.find(
                            (c: any) =>
                              c.companyId ===
                              formData.leavePolicyMaster.companyId
                          )?.companyName ||
                          formData.leavePolicyMaster.companyId.toString(),
                      }
                    : null
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    leavePolicyMaster: {
                      ...prev.leavePolicyMaster,
                      companyId: value ? Number(value.id) : 0,
                    },
                  }))
                }
                placeholder="Select company"
              />
            </div>

            {/* Policy Name */}
            <div className="space-y-2">
              <Label htmlFor="policyName">
                Policy Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="policyName"
                name="policyName"
                value={formData.leavePolicyMaster.policyName}
                onChange={handleMasterChange}
                placeholder="e.g. Annual Leave Policy 2025"
                required
              />
            </div>

            {/* Effective From */}
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">
                Effective From <span className="text-red-500">*</span>
              </Label>
              <Input
                id="effectiveFrom"
                name="effectiveFrom"
                type="date"
                value={toInputDate(formData.leavePolicyMaster.effectiveFrom)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    leavePolicyMaster: {
                      ...prev.leavePolicyMaster,
                      effectiveFrom: e.target.value
                        ? new Date(e.target.value)
                        : new Date(),
                    },
                  }))
                }
                required
              />
            </div>

            {/* Effective To */}
            <div className="space-y-2">
              <Label htmlFor="effectiveTo">Effective To</Label>
              <Input
                id="effectiveTo"
                name="effectiveTo"
                type="date"
                value={toInputDate(formData.leavePolicyMaster.effectiveTo)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    leavePolicyMaster: {
                      ...prev.leavePolicyMaster,
                      effectiveTo: e.target.value
                        ? new Date(e.target.value)
                        : null,
                    },
                  }))
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.leavePolicyMaster.description ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    leavePolicyMaster: {
                      ...prev.leavePolicyMaster,
                      description: e.target.value || null,
                    },
                  }))
                }
                placeholder="Optional policy description"
              />
            </div>

            {/* Active — CustomSwitch */}
            <div className="col-span-2">
              <CustomSwitch
                label="Active"
                checked={formData.leavePolicyMaster.active}
                onChange={(value) => handleMasterSwitchChange('active', value)}
              />
            </div>
          </div>

          {/* ── Leave Policy Details ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">
                Leave Policy Details <span className="text-red-500">*</span>
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-400 hover:bg-amber-50"
                onClick={handleAddDetail}
              >
                + Add Detail
              </Button>
            </div>
            <div className="space-y-2">
              {formData.leavePolicyDetails.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4 border rounded-md">
                  No details added yet. Click &quot;+ Add Detail&quot; to begin.
                </p>
              ) : (
                formData.leavePolicyDetails.map((detail, idx) => (
                  <div
                    key={`${detail.leaveTypeId}-${idx}`}
                    className="border rounded-md p-3"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Leave Type */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400">
                          Leave Type
                        </span>
                        <CustomCombobox
                          items={
                            leaveTypes?.data?.map((lt: any) => ({
                              id: lt.leaveTypeId.toString(),
                              name: lt.name,
                            })) || []
                          }
                          value={
                            detail.leaveTypeId
                              ? {
                                  id: detail.leaveTypeId.toString(),
                                  name:
                                    leaveTypes?.data?.find(
                                      (lt: any) =>
                                        lt.leaveTypeId === detail.leaveTypeId
                                    )?.name || detail.leaveTypeId.toString(),
                                }
                              : null
                          }
                          onChange={(value) => {
                            // Remove old entry, update with new leaveTypeId
                            setFormData((prev) => ({
                              ...prev,
                              leavePolicyDetails: prev.leavePolicyDetails.map(
                                (d, i) =>
                                  i === idx
                                    ? {
                                        ...d,
                                        leaveTypeId: value
                                          ? Number(value.id)
                                          : 0,
                                      }
                                    : d
                              ),
                            }))
                          }}
                          placeholder="Select leave type"
                        />
                      </div>

                      {/* Accrual Frequency */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400">
                          Accrual Frequency
                        </span>
                        <Select
                          value={detail.accrualFrequency}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              leavePolicyDetails: prev.leavePolicyDetails.map(
                                (d, i) =>
                                  i === idx
                                    ? {
                                        ...d,
                                        accrualFrequency:
                                          value as AccrualFrequency,
                                      }
                                    : d
                              ),
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 w-32 text-xs shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACCRUAL_FREQUENCY_OPTIONS.map((freq) => (
                              <SelectItem key={freq} value={freq}>
                                {freq}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Accrual Rate */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400">
                          Accrual Rate
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          className="h-8 text-xs w-24"
                          value={detail.accrualRate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              leavePolicyDetails: prev.leavePolicyDetails.map(
                                (d, i) =>
                                  i === idx
                                    ? {
                                        ...d,
                                        accrualRate: Number(e.target.value),
                                      }
                                    : d
                              ),
                            }))
                          }
                        />
                      </div>

                      {/* Yearly Allocation */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400">
                          Yearly Alloc
                        </span>
                        <Input
                          type="number"
                          min={0}
                          className="h-8 text-xs w-24"
                          value={detail.yearlyAllocation}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              leavePolicyDetails: prev.leavePolicyDetails.map(
                                (d, i) =>
                                  i === idx
                                    ? {
                                        ...d,
                                        yearlyAllocation: Number(
                                          e.target.value
                                        ),
                                      }
                                    : d
                              ),
                            }))
                          }
                        />
                      </div>

                      {/* Max Balance */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400">
                          Max Balance
                        </span>
                        <Input
                          type="number"
                          min={0}
                          className="h-8 text-xs w-24"
                          value={detail.maxBalanceAllowed}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              leavePolicyDetails: prev.leavePolicyDetails.map(
                                (d, i) =>
                                  i === idx
                                    ? {
                                        ...d,
                                        maxBalanceAllowed: Number(
                                          e.target.value
                                        ),
                                      }
                                    : d
                              ),
                            }))
                          }
                        />
                      </div>

                      {/* Carry Forward Limit */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400">
                          Carry Fwd Limit
                        </span>
                        <Input
                          type="number"
                          min={0}
                          className="h-8 text-xs w-24"
                          value={detail.carryForwardLimit}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              leavePolicyDetails: prev.leavePolicyDetails.map(
                                (d, i) =>
                                  i === idx
                                    ? {
                                        ...d,
                                        carryForwardLimit: Number(
                                          e.target.value
                                        ),
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
                            leavePolicyDetails: prev.leavePolicyDetails.filter(
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
            <AlertDialogTitle>Delete Leave Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this leave policy? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingPolicyId) {
                  deleteMutation.mutate({ id: deletingPolicyId })
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

export default LeavePolicy
