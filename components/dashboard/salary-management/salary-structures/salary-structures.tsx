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
  DollarSign,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateSalaryStructureType,
  GetSalaryStructureType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useGetSalaryStructures,
  useAddSalaryStructures,
  useUpdateSalaryStructures,
  useDeleteSalaryStructures,
  useGetCompanies,
  useGetSalaryComponents,
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

// Structure type options matching the schema enum
const STRUCTURE_TYPE_OPTIONS = ['Earning', 'Deduction'] as const
type StructureType = (typeof STRUCTURE_TYPE_OPTIONS)[number]

const defaultSalaryStructureMaster: CreateSalaryStructureType['salaryStructureMaster'] =
  {
    structureName: '',
    structureCode: null,
    companyId: 0,
    structureType: 'Earning',
    effectiveFrom: new Date(),
    effectiveTo: null,
    active: true,
    createdBy: 0,
    createdAt: new Date(),
    updatedBy: null,
    updatedAt: null,
  }

const defaultFormData: CreateSalaryStructureType = {
  salaryStructureMaster: defaultSalaryStructureMaster,
  salaryStructureDetails: [],
}

const SalaryStructure = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: salaryStructure } = useGetSalaryStructures()
  console.log('🚀 ~ SalaryStructure ~ salaryStructure:', salaryStructure)
  const { data: companies } = useGetCompanies()
  const { data: salaryComponents } = useGetSalaryComponents()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [structuresPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetSalaryStructureType['salaryStructureMaster']>(
      'structureName'
    )
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingStructureId, setEditingStructureId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingStructureId, setDeletingStructureId] = useState<number | null>(
    null
  )
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRowExpand = (structureId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      next.has(structureId) ? next.delete(structureId) : next.add(structureId)
      return next
    })
  }

  const [formData, setFormData] =
    useState<CreateSalaryStructureType>(defaultFormData)

  // ─── SalaryStructureMaster field helpers ──────────────────────────────────

  const handleMasterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      salaryStructureMaster: { ...prev.salaryStructureMaster, [name]: value },
    }))
  }

  const handleMasterSwitchChange = (
    field: keyof CreateSalaryStructureType['salaryStructureMaster'],
    value: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      salaryStructureMaster: { ...prev.salaryStructureMaster, [field]: value },
      ...(field === 'active' && {
        salaryStructureDetails: prev.salaryStructureDetails.map((d) => ({
          ...d,
          active: value,
        })),
      }),
    }))
  }

  // ─── SalaryStructureDetails helpers ──────────────────────────────────────

  const handleAddDetail = () => {
    const newDetail: CreateSalaryStructureType['salaryStructureDetails'][number] =
      {
        salaryStructureMasterId: null,
        salaryComponentId: 0,
        amount: 0,
        percentage: null,
        formulaExpression: null,
        calculationOrder: 1,
        mandatory: true,
        createdBy: userData?.userId || 0,
        createdAt: new Date(),
        updatedBy: null,
        updatedAt: null,
      }
    setFormData((prev) => ({
      ...prev,
      salaryStructureDetails: [
        newDetail,
        ...prev.salaryStructureDetails.map((d) => ({
          ...d,
          calculationOrder: d.calculationOrder + 1,
        })),
      ],
    }))
  }

  const getComponentCalcType = (salaryComponentId: number) => {
    return (
      salaryComponents?.data?.find(
        (sc: any) => sc.salaryComponentId === salaryComponentId
      )?.calculationType ?? null
    )
  }

  // ─── Reset / Close ────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormData({
      ...defaultFormData,
      salaryStructureMaster: {
        ...defaultSalaryStructureMaster,
        createdBy: userData?.userId || 0,
      },
    })
    setEditingStructureId(null)
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

  const addMutation = useAddSalaryStructures({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateSalaryStructures({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteSalaryStructures({
    onClose: closePopup,
    reset: resetForm,
  })

  // ─── Sorting / Filtering / Pagination ────────────────────────────────────

  const handleSort = (
    column: keyof GetSalaryStructureType['salaryStructureMaster']
  ) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredStructures = useMemo(() => {
    if (!salaryStructure?.data) return []
    const list = Array.isArray(salaryStructure.data)
      ? salaryStructure.data
      : [salaryStructure.data]
    return list.filter(
      (item: any) =>
        item.salaryStructureMaster?.structureName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.salaryStructureMaster?.structureCode
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.salaryStructureMaster?.companyName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.salaryStructureMaster?.structureType
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
    )
  }, [salaryStructure?.data, searchTerm])

  const sortedStructures = useMemo(() => {
    return [...filteredStructures].sort((a: any, b: any) => {
      const aValue = a.salaryStructureMaster?.[sortColumn] ?? ''
      const bValue = b.salaryStructureMaster?.[sortColumn] ?? ''
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      return 0
    })
  }, [filteredStructures, sortColumn, sortDirection])

  const paginatedStructures = useMemo(() => {
    const startIndex = (currentPage - 1) * structuresPerPage
    return sortedStructures.slice(startIndex, startIndex + structuresPerPage)
  }, [sortedStructures, currentPage, structuresPerPage])

  const totalPages = Math.ceil(sortedStructures.length / structuresPerPage)

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!formData.salaryStructureMaster.companyId) {
        setError('Please select a company')
        return
      }
      if (!formData.salaryStructureMaster.structureName.trim()) {
        setError('Structure name is required')
        return
      }
      if (!formData.salaryStructureMaster.effectiveFrom) {
        setError('Effective from date is required')
        return
      }
      if (formData.salaryStructureDetails.length === 0) {
        setError('Please add at least one salary structure detail')
        return
      }
      const hasInvalidComponent = formData.salaryStructureDetails.some(
        (d) => !d.salaryComponentId
      )
      if (hasInvalidComponent) {
        setError('Please select a salary component for all structure details')
        return
      }

      try {
        if (isEditMode && editingStructureId) {
          const updateData: GetSalaryStructureType = {
            salaryStructureMaster: {
              ...formData.salaryStructureMaster,
              updatedBy: userData?.userId || 0,
              updatedAt: new Date(),
            },
            salaryStructureDetails: formData.salaryStructureDetails,
          }
          updateMutation.mutate({ id: editingStructureId, data: updateData })
        } else {
          const createData: CreateSalaryStructureType = {
            salaryStructureMaster: {
              ...formData.salaryStructureMaster,
              createdBy: userData?.userId || 0,
              createdAt: new Date(),
            },
            salaryStructureDetails: formData.salaryStructureDetails.map(
              (d) => ({
                ...d,
                createdBy: userData?.userId || 0,
                createdAt: new Date(),
              })
            ),
          }
          addMutation.mutate(createData)
        }
      } catch (err) {
        setError('Failed to save salary structure')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingStructureId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving salary structure')
    }
  }, [addMutation.error, updateMutation.error])

  // ─── Edit handler ─────────────────────────────────────────────────────────

  const handleEditClick = (item: any) => {
    setIsEditMode(true)
    setEditingStructureId(
      item.salaryStructureMaster?.salaryStructureMasterId || null
    )
    setFormData({
      salaryStructureMaster: {
        ...item.salaryStructureMaster,
        updatedBy: userData?.userId || 0,
      },
      salaryStructureDetails: item.salaryStructureDetails || [],
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
          <div className="bg-blue-100 p-2 rounded-md">
            <DollarSign className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Salary Structure</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search structures..."
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
                onClick={() => handleSort('structureName')}
                className="cursor-pointer"
              >
                Structure Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('structureCode')}
                className="cursor-pointer"
              >
                Code <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead
                onClick={() => handleSort('structureType')}
                className="cursor-pointer"
              >
                Type <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!salaryStructure || salaryStructure.data === undefined ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  Loading salary structures...
                </TableCell>
              </TableRow>
            ) : !salaryStructure.data || salaryStructure.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No salary structures found
                </TableCell>
              </TableRow>
            ) : paginatedStructures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No salary structures match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedStructures.map((item: any, index: number) => {
                const structureId =
                  item.salaryStructureMaster?.salaryStructureMasterId
                const isExpanded = expandedRows.has(structureId)
                const details: any[] = item.salaryStructureDetails || []

                return (
                  <React.Fragment key={`fragment-${structureId ?? index}`}>
                    <TableRow
                      className="cursor-pointer hover:bg-blue-50"
                      onClick={() => toggleRowExpand(structureId)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          {(currentPage - 1) * structuresPerPage + index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.salaryStructureMaster?.structureName}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {item.salaryStructureMaster?.structureCode || '—'}
                      </TableCell>
                      <TableCell>
                        {item.salaryStructureMaster?.companyName || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.salaryStructureMaster?.structureType ===
                            'Earning'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {item.salaryStructureMaster?.structureType}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatDate(item.salaryStructureMaster?.effectiveFrom)}
                      </TableCell>
                      <TableCell>
                        {formatDate(item.salaryStructureMaster?.effectiveTo)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.salaryStructureMaster?.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.salaryStructureMaster?.active
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
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => handleEditClick(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setDeletingStructureId(
                                item.salaryStructureMaster
                                  ?.salaryStructureMasterId || null
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
                        <TableCell colSpan={9} className="py-3 px-6">
                          <div className="text-xs font-semibold text-gray-500 mb-2">
                            Salary Structure Details
                          </div>
                          <div className="space-y-1">
                            {details.length === 0 ? (
                              <p className="text-xs text-gray-400">
                                No structure details found.
                              </p>
                            ) : (
                              details.map((d: any) => (
                                <div
                                  key={
                                    d.salaryStructureDetailId ??
                                    d.salaryComponentId
                                  }
                                  className="flex items-center gap-4 text-xs border rounded px-3 py-1.5 bg-white"
                                >
                                  <span className="font-medium w-36">
                                    {d.salaryComponentName ||
                                      `Component #${d.salaryComponentId}`}
                                  </span>
                                  <div
                                    key={
                                      d.salaryStructureDetailId ??
                                      d.salaryComponentId
                                    }
                                    className="flex items-center gap-4 text-xs border rounded px-3 py-1.5 bg-white"
                                  >
                                    <span className="font-medium w-36">
                                      {d.salaryComponentName ||
                                        `Component #${d.salaryComponentId}`}
                                    </span>

                                    {/* ↓ replaces the three Amount/Percentage/Formula spans */}
                                    {(() => {
                                      const calcType = getComponentCalcType(
                                        d.salaryComponentId
                                      )
                                      if (calcType === 'Fixed')
                                        return (
                                          <span className="text-gray-500">
                                            Amount:{' '}
                                            <span className="text-gray-800">
                                              {d.amount}
                                            </span>
                                          </span>
                                        )
                                      if (calcType === 'Percentage')
                                        return (
                                          <span className="text-gray-500">
                                            Percentage:{' '}
                                            <span className="text-gray-800">
                                              {d.percentage ?? '—'}%
                                            </span>
                                          </span>
                                        )
                                      if (calcType === 'Formula')
                                        return (
                                          <span className="text-gray-500">
                                            Formula:{' '}
                                            <span className="text-gray-800">
                                              {d.formulaExpression || '—'}
                                            </span>
                                          </span>
                                        )
                                      return null
                                    })()}

                                    <span className="text-gray-500">
                                      Calc Order:{' '}
                                      <span className="text-gray-800">
                                        {d.calculationOrder}
                                      </span>
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full font-medium ${
                                        d.mandatory
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}
                                    >
                                      {d.mandatory ? 'Mandatory' : 'Optional'}
                                    </span>
                                  </div>
                                  <span className="text-gray-500">
                                    Calc Order:{' '}
                                    <span className="text-gray-800">
                                      {d.calculationOrder}
                                    </span>
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-medium ${
                                      d.mandatory
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {d.mandatory ? 'Mandatory' : 'Optional'}
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
      {sortedStructures.length > 0 && (
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
        title={isEditMode ? 'Edit Salary Structure' : 'Add Salary Structure'}
        size="sm:max-w-5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* ── Structure Master Info ── */}
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
                  formData.salaryStructureMaster.companyId
                    ? {
                        id: formData.salaryStructureMaster.companyId.toString(),
                        name:
                          companies?.data?.find(
                            (c: any) =>
                              c.companyId ===
                              formData.salaryStructureMaster.companyId
                          )?.companyName ||
                          formData.salaryStructureMaster.companyId.toString(),
                      }
                    : null
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    salaryStructureMaster: {
                      ...prev.salaryStructureMaster,
                      companyId: value ? Number(value.id) : 0,
                    },
                  }))
                }
                placeholder="Select company"
              />
            </div>

            {/* Structure Name */}
            <div className="space-y-2">
              <Label htmlFor="structureName">
                Structure Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="structureName"
                name="structureName"
                value={formData.salaryStructureMaster.structureName}
                onChange={handleMasterChange}
                placeholder="e.g. Basic Salary Structure 2025"
                required
              />
            </div>

            {/* Structure Code */}
            <div className="space-y-2">
              <Label htmlFor="structureCode">Structure Code</Label>
              <Input
                id="structureCode"
                name="structureCode"
                value={formData.salaryStructureMaster.structureCode ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    salaryStructureMaster: {
                      ...prev.salaryStructureMaster,
                      structureCode: e.target.value || null,
                    },
                  }))
                }
                placeholder="e.g. SS-001"
              />
            </div>

            {/* Structure Type */}
            <div className="space-y-2">
              <Label htmlFor="structureType">
                Structure Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.salaryStructureMaster.structureType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    salaryStructureMaster: {
                      ...prev.salaryStructureMaster,
                      structureType: value as StructureType,
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {STRUCTURE_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                value={toInputDate(
                  formData.salaryStructureMaster.effectiveFrom
                )}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    salaryStructureMaster: {
                      ...prev.salaryStructureMaster,
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
                value={toInputDate(formData.salaryStructureMaster.effectiveTo)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    salaryStructureMaster: {
                      ...prev.salaryStructureMaster,
                      effectiveTo: e.target.value
                        ? new Date(e.target.value)
                        : null,
                    },
                  }))
                }
              />
            </div>

            {/* Active — CustomSwitch */}
            <div className="col-span-2">
              <CustomSwitch
                label="Active"
                checked={formData.salaryStructureMaster.active}
                onChange={(value) => handleMasterSwitchChange('active', value)}
              />
            </div>
          </div>

          {/* ── Salary Structure Details ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">
                Salary Structure Details <span className="text-red-500">*</span>
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
              {formData.salaryStructureDetails.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4 border rounded-md">
                  No details added yet. Click &quot;+ Add Detail&quot; to begin.
                </p>
              ) : (
                formData.salaryStructureDetails.map((detail, idx) => (
                  <div
                    key={`${detail.salaryComponentId}-${idx}`}
                    className="border rounded-md p-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                      {/* Salary Component */}
                      <div className="flex flex-col gap-0.5 md:col-span-2">
                        <span className="text-[10px] text-gray-400">
                          Salary Component
                        </span>
                        <CustomCombobox
                          items={
                            salaryComponents?.data?.map((sc: any) => ({
                              id: sc.salaryComponentId.toString(),
                              name: sc.componentName,
                            })) || []
                          }
                          value={
                            detail.salaryComponentId
                              ? {
                                  id: detail.salaryComponentId.toString(),
                                  name:
                                    salaryComponents?.data?.find(
                                      (sc: any) =>
                                        sc.salaryComponentId ===
                                        detail.salaryComponentId
                                    )?.componentName ||
                                    detail.salaryComponentId.toString(),
                                }
                              : null
                          }
                          onChange={(value) => {
                            const selected = salaryComponents?.data?.find(
                              (sc: any) =>
                                sc.salaryComponentId === Number(value?.id)
                            )

                            setFormData((prev) => ({
                              ...prev,
                              salaryStructureDetails:
                                prev.salaryStructureDetails.map((d, i) =>
                                  i === idx
                                    ? {
                                        ...d,
                                        salaryComponentId: value
                                          ? Number(value.id)
                                          : 0,
                                        amount:
                                          selected?.calculationType === 'Fixed'
                                            ? (selected.amount ?? 0)
                                            : 0,
                                        percentage:
                                          selected?.calculationType ===
                                          'Percentage'
                                            ? (selected.percentage ?? null)
                                            : null,
                                        formulaExpression:
                                          selected?.calculationType ===
                                          'Formula'
                                            ? (selected.formulaExpression ??
                                              null)
                                            : null,
                                      }
                                    : d
                                ),
                            }))
                          }}
                          placeholder="Select component"
                        />
                      </div>

                      {/* Dynamic Value Field */}
                      <div className="flex flex-col gap-0.5">
                        {(() => {
                          const calcType = getComponentCalcType(
                            detail.salaryComponentId
                          )

                          if (calcType === 'Fixed') {
                            return (
                              <>
                                <span className="text-[10px] text-gray-400">
                                  Amount
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  className="h-[37px] text-xs"
                                  value={detail.amount}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      salaryStructureDetails:
                                        prev.salaryStructureDetails.map(
                                          (d, i) =>
                                            i === idx
                                              ? {
                                                  ...d,
                                                  amount: Number(
                                                    e.target.value
                                                  ),
                                                  percentage: null,
                                                  formulaExpression: null,
                                                }
                                              : d
                                        ),
                                    }))
                                  }
                                />
                              </>
                            )
                          }

                          if (calcType === 'Percentage') {
                            return (
                              <>
                                <span className="text-[10px] text-gray-400">
                                  Percentage (%)
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.01}
                                  className="h-[37px] text-xs"
                                  value={detail.percentage ?? ''}
                                  placeholder="e.g. 10"
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      salaryStructureDetails:
                                        prev.salaryStructureDetails.map(
                                          (d, i) =>
                                            i === idx
                                              ? {
                                                  ...d,
                                                  percentage: e.target.value
                                                    ? Number(e.target.value)
                                                    : null,
                                                  amount: 0,
                                                  formulaExpression: null,
                                                }
                                              : d
                                        ),
                                    }))
                                  }
                                />
                              </>
                            )
                          }

                          if (calcType === 'Formula') {
                            return (
                              <>
                                <span className="text-[10px] text-gray-400">
                                  Formula
                                </span>
                                <Input
                                  type="text"
                                  className="h-[37px] text-xs"
                                  value={detail.formulaExpression ?? ''}
                                  placeholder="e.g. BASIC * 0.12"
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      salaryStructureDetails:
                                        prev.salaryStructureDetails.map(
                                          (d, i) =>
                                            i === idx
                                              ? {
                                                  ...d,
                                                  formulaExpression:
                                                    e.target.value || null,
                                                  amount: 0,
                                                  percentage: null,
                                                }
                                              : d
                                        ),
                                    }))
                                  }
                                />
                              </>
                            )
                          }

                          return (
                            <>
                              <span className="text-[10px] text-gray-400">
                                Value
                              </span>
                              <div className="h-[37px] flex items-center text-xs text-gray-400 italic">
                                Select a component first
                              </div>
                            </>
                          )
                        })()}
                      </div>

                      {/* Calculation Order */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400">
                          Calc Order
                        </span>
                        <Input
                          type="number"
                          min={1}
                          className="h-[37px] text-xs"
                          value={detail.calculationOrder}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              salaryStructureDetails:
                                prev.salaryStructureDetails.map((d, i) =>
                                  i === idx
                                    ? {
                                        ...d,
                                        calculationOrder: Number(
                                          e.target.value
                                        ),
                                      }
                                    : d
                                ),
                            }))
                          }
                        />
                      </div>

                      {/* Mandatory Switch */}
                      <div className="flex flex-col self-end">
                        <span className="text-[10px] text-gray-400 pb-1">
                          Mandatory
                        </span>
                        <CustomSwitch
                          checked={detail.mandatory}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              salaryStructureDetails:
                                prev.salaryStructureDetails.map((d, i) =>
                                  i === idx ? { ...d, mandatory: value } : d
                                ),
                            }))
                          }
                        />
                      </div>

                      {/* Remove */}
                      <div className="flex flex-col gap-0.5 items-end justify-center">
                        <span className="text-[10px] text-gray-400 pb-1 pr-2">
                          Action
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 border"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              salaryStructureDetails:
                                prev.salaryStructureDetails.filter(
                                  (_, i) => i !== idx
                                ),
                            }))
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
            <AlertDialogTitle>Delete Salary Structure</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this salary structure? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingStructureId) {
                  deleteMutation.mutate({ id: deletingStructureId })
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

export default SalaryStructure
