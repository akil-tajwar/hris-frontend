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
import { ArrowUpDown, Search, BookOpen, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateEmploymentTypeType, GetEmploymentTypeType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddEmploymentType,
  useDeleteEmploymentType,
  useGetEmploymentTypes,
  useUpdateEmploymentType,
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

const EmploymentTypes = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: employmentTypes } = useGetEmploymentTypes()
  console.log('🚀 ~ EmploymentTypes ~ employmentTypes:', employmentTypes)

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [employmentTypesPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetEmploymentTypeType>('employmentTypeName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingEmploymentTypeId, setEditingEmploymentTypeId] = useState<
    number | null
  >(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingEmploymentTypeId, setDeletingEmploymentTypeId] = useState<
    number | null
  >(null)

  const [formData, setFormData] = useState<CreateEmploymentTypeType>({
    employmentTypeName: '',
    createdBy: userData?.userId || 0,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = useCallback(() => {
    setFormData({
      employmentTypeName: '',
      createdBy: userData?.userId || 0,
    })
    setEditingEmploymentTypeId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddEmploymentType({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateEmploymentType({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteEmploymentType({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetEmploymentTypeType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredEmploymentTypes = useMemo(() => {
    if (!employmentTypes?.data) return []
    return employmentTypes.data?.filter((dept) =>
      dept.employmentTypeName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employmentTypes?.data, searchTerm])

  const sortedEmploymentTypes = useMemo(() => {
    return [...filteredEmploymentTypes].sort((a, b) => {
      const aValue = a.employmentTypeName ?? ''
      const bValue = b.employmentTypeName ?? ''
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    })
  }, [filteredEmploymentTypes, sortDirection])

  const paginatedEmploymentTypes = useMemo(() => {
    const startIndex = (currentPage - 1) * employmentTypesPerPage
    return sortedEmploymentTypes.slice(
      startIndex,
      startIndex + employmentTypesPerPage
    )
  }, [sortedEmploymentTypes, currentPage, employmentTypesPerPage])

  const totalPages = Math.ceil(
    sortedEmploymentTypes.length / employmentTypesPerPage
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      setError(null)

      try {
        const submitData: CreateEmploymentTypeType = {
          employmentTypeName: formData.employmentTypeName,
          createdBy: formData.createdBy,
        }

        if (isEditMode) {
          submitData.updatedBy = userData?.userId || 0
        } else {
          submitData.createdBy = userData?.userId || 0
        }

        if (isEditMode && editingEmploymentTypeId) {
          updateMutation.mutate({
            id: editingEmploymentTypeId,
            data: submitData,
          })
          console.log('update', isEditMode, editingEmploymentTypeId)
        } else {
          addMutation.mutate(submitData)
          console.log('create')
        }
      } catch (err) {
        setError('Failed to save employmentType')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingEmploymentTypeId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving employmentType')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (dept: any) => {
    setFormData({
      employmentTypeName: dept.employmentTypeName,
      createdBy: userData?.userId || 0,
    })
    setEditingEmploymentTypeId(dept.employmentTypeId)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <BookOpen className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Employment Types</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search employmentTypes..."
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
              <TableHead
                onClick={() => handleSort('employmentTypeName')}
                className="cursor-pointer"
              >
                Employment Type Name
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!employmentTypes || employmentTypes.data === undefined ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Loading employee types...
                </TableCell>
              </TableRow>
            ) : !employmentTypes.data || employmentTypes.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No employee types found
                </TableCell>
              </TableRow>
            ) : paginatedEmploymentTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No employee types match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmploymentTypes.map((dept: any, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {dept.employmentTypeName}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditClick(dept)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingEmploymentTypeId(dept.employmentTypeId)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {sortedEmploymentTypes.length > 0 && (
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

      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit EmploymentType' : 'Add EmploymentType'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="employmentTypeName">
                EmploymentType Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="employmentTypeName"
                name="employmentTypeName"
                value={formData.employmentTypeName}
                onChange={handleInputChange}
                required
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

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete EmploymentType</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employmentType? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingEmploymentTypeId) {
                  deleteMutation.mutate({ id: deletingEmploymentTypeId })
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

export default EmploymentTypes
