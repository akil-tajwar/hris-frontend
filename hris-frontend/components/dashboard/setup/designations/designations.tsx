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
import type { CreateDesignationType, GetDesignationType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddDesignation,
  useDeleteDesignation,
  useGetDesignations,
  useUpdateDesignation,
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

const Designations = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: designations } = useGetDesignations()
  console.log('🚀 ~ Designations ~ designations:', designations)

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [designationsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetDesignationType>('designationName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingDesignationId, setEditingDesignationId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingDesignationId, setDeletingDesignationId] = useState<
    number | null
  >(null)

  const [formData, setFormData] = useState<CreateDesignationType>({
    designationName: '',
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
      designationName: '',
      createdBy: userData?.userId || 0,
    })
    setEditingDesignationId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddDesignation({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateDesignation({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteDesignation({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetDesignationType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredDesignations = useMemo(() => {
    if (!designations?.data) return []
    return designations.data?.filter((dept) =>
      dept.designationName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [designations?.data, searchTerm])

  const sortedDesignations = useMemo(() => {
    return [...filteredDesignations].sort((a, b) => {
      const aValue = a.designationName ?? ''
      const bValue = b.designationName ?? ''
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    })
  }, [filteredDesignations, sortDirection])

  const paginatedDesignations = useMemo(() => {
    const startIndex = (currentPage - 1) * designationsPerPage
    return sortedDesignations.slice(startIndex, startIndex + designationsPerPage)
  }, [sortedDesignations, currentPage, designationsPerPage])

  const totalPages = Math.ceil(sortedDesignations.length / designationsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      setError(null)

      try {
        const submitData: CreateDesignationType = {
          designationName: formData.designationName,
          createdBy: formData.createdBy,
        }

        if (isEditMode) {
          submitData.updatedBy = userData?.userId || 0
        } else {
          submitData.createdBy = userData?.userId || 0
        }

        if (isEditMode && editingDesignationId) {
          updateMutation.mutate({
            id: editingDesignationId,
            data: submitData,
          })
          console.log('update', isEditMode, editingDesignationId)
        } else {
          addMutation.mutate(submitData)
          console.log('create')
        }
      } catch (err) {
        setError('Failed to save designation')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingDesignationId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving designation')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (dept: any) => {
    setFormData({
      designationName: dept.designationName,
      createdBy: userData?.userId || 0,
    })
    setEditingDesignationId(dept.designationId)
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
          <h2 className="text-lg font-semibold">Designations</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search designations..."
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
                onClick={() => handleSort('designationName')}
                className="cursor-pointer"
              >
                Designation Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!designations || designations.data === undefined ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Loading designations...
                </TableCell>
              </TableRow>
            ) : !designations.data || designations.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No designations found
                </TableCell>
              </TableRow>
            ) : paginatedDesignations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No designations match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedDesignations.map((dept: any, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {dept.designationName}
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
                          setDeletingDesignationId(dept.designationId)
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

      {sortedDesignations.length > 0 && (
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
        title={isEditMode ? 'Edit Designation' : 'Add Designation'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="designationName">
                Designation Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="designationName"
                name="designationName"
                value={formData.designationName}
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
            <AlertDialogTitle>Delete Designation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this designation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingDesignationId) {
                  deleteMutation.mutate({ id: deletingDesignationId })
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

export default Designations
