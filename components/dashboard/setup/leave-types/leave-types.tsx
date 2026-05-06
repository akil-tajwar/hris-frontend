'use client'

import type React from 'react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  BookOpen,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  Plus,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateLeaveTypeType, GetLeaveTypeType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddLeaveType,
  useDeleteLeaveType,
  useGetLeaveTypes,
  useUpdateLeaveType,
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

const LeaveTypes = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: leaveTypes } = useGetLeaveTypes()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [groupsPerPage] = useState(5)
  const [sortColumn, setSortColumn] =
    useState<keyof GetLeaveTypeType>('leaveTypeName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isCopyPopupOpen, setIsCopyPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingLeaveTypeId, setEditingLeaveTypeId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingLeaveTypeId, setDeletingLeaveTypeId] = useState<number | null>(
    null
  )

  // Get current year and next 2 years
  const currentYear = new Date().getFullYear()
  const availableYears = [currentYear, currentYear + 1, currentYear + 2]

  const [formData, setFormData] = useState<CreateLeaveTypeType>({
    leaveTypeName: '',
    totalLeaves: 0,
    yearPeriod: currentYear,
    createdBy: userData?.userId || 0,
  })

  // For copy functionality
  const [copySourceYear, setCopySourceYear] = useState<number | null>(null)
  const [copyTargetYear, setCopyTargetYear] = useState<number>(currentYear)
  const [leaveTypesToCopy, setLeaveTypesToCopy] = useState<
    Array<{
      leaveTypeName: string
      totalLeaves: number
    }>
  >([])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleYearChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      yearPeriod: parseInt(value),
    }))
  }

  const resetForm = useCallback(() => {
    setFormData({
      leaveTypeName: '',
      totalLeaves: 0,
      yearPeriod: currentYear,
      createdBy: userData?.userId || 0,
    })
    setEditingLeaveTypeId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId, currentYear])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const closeCopyPopup = useCallback(() => {
    setIsCopyPopupOpen(false)
    setCopySourceYear(null)
    setCopyTargetYear(currentYear)
    setLeaveTypesToCopy([])
    setError(null)
  }, [currentYear])

  const addMutation = useAddLeaveType({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateLeaveType({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteLeaveType({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetLeaveTypeType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredLeaveTypes = useMemo(() => {
    if (!leaveTypes?.data || !Array.isArray(leaveTypes.data)) return []
    return leaveTypes.data.filter((leaveType) =>
      leaveType.leaveTypeName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [leaveTypes?.data, searchTerm])

  // Group leave types by yearPeriod and sort
  const groupedLeaveTypes = useMemo(() => {
    if (!Array.isArray(filteredLeaveTypes)) return []

    const groups = filteredLeaveTypes.reduce(
      (acc, leaveType) => {
        const year = leaveType.yearPeriod || currentYear
        if (!acc[year]) {
          acc[year] = []
        }
        acc[year].push(leaveType)
        return acc
      },
      {} as Record<number, GetLeaveTypeType[]>
    )

    // Sort each group's leave types
    Object.keys(groups).forEach((year) => {
      groups[parseInt(year)].sort((a, b) => {
        const aValue = a[sortColumn] ?? ''
        const bValue = b[sortColumn] ?? ''

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        return sortDirection === 'asc'
          ? aValue > bValue
            ? 1
            : -1
          : bValue > aValue
            ? 1
            : -1
      })
    })

    // Sort years in descending order (latest first)
    return Object.entries(groups).sort(
      ([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA)
    )
  }, [filteredLeaveTypes, sortColumn, sortDirection, currentYear])

  // Paginate by year groups
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * groupsPerPage
    return groupedLeaveTypes.slice(startIndex, startIndex + groupsPerPage)
  }, [groupedLeaveTypes, currentPage, groupsPerPage])

  const totalPages = Math.ceil(groupedLeaveTypes.length / groupsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      try {
        const submitData: CreateLeaveTypeType = {
          leaveTypeName: formData.leaveTypeName,
          totalLeaves: formData.totalLeaves,
          yearPeriod: formData.yearPeriod,
          createdBy: userData?.userId || 0,
        }

        if (isEditMode) {
          submitData.updatedBy = userData?.userId || 0
        }

        if (isEditMode && editingLeaveTypeId) {
          updateMutation.mutate({
            id: editingLeaveTypeId,
            data: submitData,
          })
        } else {
          // Send as array for bulk creation
          addMutation.mutate([submitData] as any)
        }
      } catch (err) {
        setError('Failed to save leave type')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingLeaveTypeId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  const handleCopySubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (leaveTypesToCopy.length === 0) {
        setError('No leave types to copy')
        return
      }

      try {
        // Create array of leave types with the new year
        const copiedLeaveTypes: CreateLeaveTypeType[] = leaveTypesToCopy.map(
          (lt) => ({
            leaveTypeName: lt.leaveTypeName,
            totalLeaves: lt.totalLeaves,
            yearPeriod: copyTargetYear,
            createdBy: userData?.userId || 0,
          })
        )

        // Send as array for bulk creation
        await addMutation.mutateAsync(copiedLeaveTypes as any)
        closeCopyPopup()
      } catch (err) {
        setError('Failed to copy leave types')
        console.error(err)
      }
    },
    [leaveTypesToCopy, copyTargetYear, addMutation, userData, closeCopyPopup]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving leave type')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (leaveType: GetLeaveTypeType) => {
    setFormData({
      leaveTypeName: leaveType.leaveTypeName,
      totalLeaves: leaveType.totalLeaves,
      yearPeriod: leaveType.yearPeriod || currentYear,
      createdBy: userData?.userId || 0,
    })
    setEditingLeaveTypeId(leaveType.leaveTypeId!)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  const handleCopyClick = (year: number, leaveTypes: GetLeaveTypeType[]) => {
    setCopySourceYear(year)
    setLeaveTypesToCopy(
      leaveTypes.map((lt) => ({
        leaveTypeName: lt.leaveTypeName,
        totalLeaves: lt.totalLeaves,
      }))
    )
    // Set default target year to next year after the source year
    setCopyTargetYear(year + 1)
    setIsCopyPopupOpen(true)
  }

  const handleCopyLeaveTypeChange = (
    index: number,
    field: 'leaveTypeName' | 'totalLeaves',
    value: string | number
  ) => {
    setLeaveTypesToCopy((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: field === 'totalLeaves' ? Number(value) : value,
      }
      return updated
    })
  }

  const handleDeleteCopiedLeaveType = (index: number) => {
    setLeaveTypesToCopy((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddNewCopyLeaveType = () => {
    setLeaveTypesToCopy((prev) => [
      ...prev,
      {
        leaveTypeName: '',
        totalLeaves: 0,
      },
    ])
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <BookOpen className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Leave Types</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search leave types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-black"
            onClick={() => setIsPopupOpen(true)}
          >
            Add Leave Type
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {!leaveTypes || leaveTypes.data === undefined ? (
          <div className="text-center py-8 text-gray-500">
            Loading leave types...
          </div>
        ) : !leaveTypes.data || leaveTypes.data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No leave types found
          </div>
        ) : paginatedGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No leave types match your search
          </div>
        ) : (
          paginatedGroups.map(([year, leaveTypesInYear]) => (
            <div
              key={year}
              className="rounded-lg border border-gray-200 overflow-hidden shadow-sm"
            >
              {/* Year Header */}
              <div className="bg-amber-200 px-6 py-4 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-black" />
                <h3 className="text-lg font-semibold text-black">
                  Year {year}
                </h3>
                <span className="ml-auto bg-black/10 px-3 py-1 rounded-full text-sm font-medium text-black">
                  {leaveTypesInYear.length}{' '}
                  {leaveTypesInYear.length === 1 ? 'type' : 'types'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="bg-amber-500 text-black"
                  onClick={() =>
                    handleCopyClick(parseInt(year), leaveTypesInYear)
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Leave Types Table */}
              <div className="bg-white">
                <Table>
                  <TableHeader className="bg-amber-50">
                    <TableRow>
                      <TableHead className="w-20">Sl No.</TableHead>
                      <TableHead
                        onClick={() => handleSort('leaveTypeName')}
                        className="cursor-pointer transition-colors"
                      >
                        Leave Type Name
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort('totalLeaves')}
                        className="cursor-pointer transition-colors"
                      >
                        Total Leaves (Days)
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveTypesInYear.map(
                      (leaveType: GetLeaveTypeType, index) => (
                        <TableRow
                          key={leaveType.leaveTypeId || index}
                          className="hover:bg-amber-50/50"
                        >
                          <TableCell className="font-medium text-gray-600">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {leaveType.leaveTypeName}
                          </TableCell>
                          <TableCell>{leaveType.totalLeaves}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                onClick={() => handleEditClick(leaveType)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setDeletingLeaveTypeId(leaveType.leaveTypeId!)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
        )}
      </div>

      {groupedLeaveTypes.length > 0 && totalPages > 1 && (
        <div className="mt-6">
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

      {/* Add/Edit Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Leave Type' : 'Add Leave Type'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="leaveTypeName">
                Leave Type Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="leaveTypeName"
                name="leaveTypeName"
                value={formData.leaveTypeName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalLeaves">
                Total Leaves (Days) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="totalLeaves"
                name="totalLeaves"
                type="number"
                min="0"
                value={formData.totalLeaves}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearPeriod">
                Year Period <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.yearPeriod.toString()}
                onValueChange={handleYearChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {addMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : 'Save'}
            </Button>
          </div>
        </form>
      </Popup>

      {/* Copy to Year Popup */}
      <Popup
        isOpen={isCopyPopupOpen}
        onClose={closeCopyPopup}
        title={`Copy Leave Types from Year ${copySourceYear}`}
        size="sm:max-w-3xl"
      >
        <form onSubmit={handleCopySubmit} className="space-y-4 py-4">
          <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                You are copying <strong>{leaveTypesToCopy.length}</strong> leave
                type
                {leaveTypesToCopy.length !== 1 ? 's' : ''} from year{' '}
                <strong>{copySourceYear}</strong>. You can modify the values,
                add new leave types, or remove items you don&apos;t want to copy.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="copyTargetYear">
                Target Year <span className="text-red-500">*</span>
              </Label>
              <Select
                value={copyTargetYear.toString()}
                onValueChange={(value) => setCopyTargetYear(parseInt(value))}
                required
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select target year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears
                    .filter((year) => year !== copySourceYear)
                    .map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center">
              <Label>Leave Types to Copy</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-amber-500 hover:bg-amber-600 text-black border-amber-500"
                onClick={handleAddNewCopyLeaveType}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Leave Type
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-gray-50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-12">Sl No.</TableHead>
                      <TableHead className="w-1/2">Leave Type Name</TableHead>
                      <TableHead>Total Leaves (Days)</TableHead>
                      <TableHead className="text-right w-20">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveTypesToCopy.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-gray-500"
                        >
                          No leave types to copy. Click &quot;Add Leave Type&quot; button
                          to add one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaveTypesToCopy.map((lt, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-gray-600">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={lt.leaveTypeName}
                              onChange={(e) =>
                                handleCopyLeaveTypeChange(
                                  index,
                                  'leaveTypeName',
                                  e.target.value
                                )
                              }
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={lt.totalLeaves}
                              onChange={(e) =>
                                handleCopyLeaveTypeChange(
                                  index,
                                  'totalLeaves',
                                  e.target.value
                                )
                              }
                              required
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteCopiedLeaveType(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeCopyPopup}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || leaveTypesToCopy.length === 0}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {addMutation.isPending ? 'Copying...' : 'Copy Leave Types'}
            </Button>
          </div>
        </form>
      </Popup>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Leave Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this leave type? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingLeaveTypeId) {
                  deleteMutation.mutate({ id: deletingLeaveTypeId })
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

export default LeaveTypes
