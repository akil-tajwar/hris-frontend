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
import type { CreateDepartmentType, GetDepartmentType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddDepartment,
  useDeleteDepartment,
  useGetDepartments,
  useUpdateDepartment,
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

const Departments = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: departments } = useGetDepartments()
  console.log('🚀 ~ Departments ~ departments:', departments)

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [departmentsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetDepartmentType>('departmentName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<
    number | null
  >(null)

  const [formData, setFormData] = useState<CreateDepartmentType>({
    departmentName: '',
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
      departmentName: '',
      createdBy: userData?.userId || 0,
    })
    setEditingDepartmentId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddDepartment({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateDepartment({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteDepartment({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetDepartmentType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredDepartments = useMemo(() => {
    if (!departments?.data) return []
    return departments.data?.filter((dept) =>
      dept.departmentName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [departments?.data, searchTerm])

  const sortedDepartments = useMemo(() => {
    return [...filteredDepartments].sort((a, b) => {
      const aValue = a.departmentName ?? ''
      const bValue = b.departmentName ?? ''
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    })
  }, [filteredDepartments, sortDirection])

  const paginatedDepartments = useMemo(() => {
    const startIndex = (currentPage - 1) * departmentsPerPage
    return sortedDepartments.slice(startIndex, startIndex + departmentsPerPage)
  }, [sortedDepartments, currentPage, departmentsPerPage])

  const totalPages = Math.ceil(sortedDepartments.length / departmentsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      setError(null)

      try {
        const submitData: CreateDepartmentType = {
          departmentName: formData.departmentName,
          createdBy: formData.createdBy,
        }

        if (isEditMode) {
          submitData.updatedBy = userData?.userId || 0
        } else {
          submitData.createdBy = userData?.userId || 0
        }

        if (isEditMode && editingDepartmentId) {
          updateMutation.mutate({
            id: editingDepartmentId,
            data: submitData,
          })
          console.log('update', isEditMode, editingDepartmentId)
        } else {
          addMutation.mutate(submitData)
          console.log('create')
        }
      } catch (err) {
        setError('Failed to save department')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingDepartmentId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving department')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (dept: any) => {
    setFormData({
      departmentName: dept.departmentName,
      createdBy: userData?.userId || 0,
    })
    setEditingDepartmentId(dept.departmentId)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <BookOpen className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Departments</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search departments..."
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

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead
                onClick={() => handleSort('departmentName')}
                className="cursor-pointer"
              >
                Department Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!departments || departments.data === undefined ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Loading departments...
                </TableCell>
              </TableRow>
            ) : !departments.data || departments.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No departments found
                </TableCell>
              </TableRow>
            ) : paginatedDepartments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No departments match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedDepartments.map((dept: any, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {dept.departmentName}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(dept)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingDepartmentId(dept.departmentId)
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

      {sortedDepartments.length > 0 && (
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
        title={isEditMode ? 'Edit Department' : 'Add Department'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="departmentName">
                Department Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="departmentName"
                name="departmentName"
                value={formData.departmentName}
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
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this department? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingDepartmentId) {
                  deleteMutation.mutate({ id: deletingDepartmentId })
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

export default Departments
