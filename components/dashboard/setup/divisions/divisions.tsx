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
import { ArrowUpDown, Search, Network, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateDivisionType, GetDivisionType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddDivision,
  useDeleteDivision,
  useGetDivisions,
  useUpdateDivision,
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

const Divisions = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: divisions } = useGetDivisions()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [divisionsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetDivisionType>('divisionName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingDivisionId, setEditingDivisionId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingDivisionId, setDeletingDivisionId] = useState<number | null>(
    null
  )

  const [formData, setFormData] = useState<CreateDivisionType>({
    divisionName: '',
    createdBy: userData?.userId || 0,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = useCallback(() => {
    setFormData({
      divisionName: '',
      createdBy: userData?.userId || 0,
    })
    setEditingDivisionId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddDivision({ onClose: closePopup, reset: resetForm })
  const updateMutation = useUpdateDivision({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteDivision({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetDivisionType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredDivisions = useMemo(() => {
    if (!divisions?.data || !Array.isArray(divisions.data)) return []
    return divisions.data.filter((division) =>
      division.divisionName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [divisions?.data, searchTerm])

  const sortedDivisions = useMemo(() => {
    if (!Array.isArray(filteredDivisions)) return []
    return [...filteredDivisions].sort((a, b) => {
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
  }, [filteredDivisions, sortColumn, sortDirection])

  const paginatedDivisions = useMemo(() => {
    const startIndex = (currentPage - 1) * divisionsPerPage
    return sortedDivisions.slice(startIndex, startIndex + divisionsPerPage)
  }, [sortedDivisions, currentPage, divisionsPerPage])

  const totalPages = Math.ceil(sortedDivisions.length / divisionsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      try {
        const submitData: CreateDivisionType = {
          divisionName: formData.divisionName,
          createdBy: formData.createdBy,
        }
        if (isEditMode) {
          submitData.updatedBy = userData?.userId || 0
        } else {
          submitData.createdBy = userData?.userId || 0
        }
        if (isEditMode && editingDivisionId) {
          updateMutation.mutate({ id: editingDivisionId, data: submitData })
        } else {
          addMutation.mutate(submitData)
        }
      } catch (err) {
        setError('Failed to save division')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingDivisionId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving division')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (division: any) => {
    setFormData({
      divisionName: division.divisionName,
      createdBy: userData?.userId || 0,
    })
    setEditingDivisionId(division.divisionId)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <Network className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Divisions</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search divisions..."
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
                onClick={() => handleSort('divisionName')}
                className="cursor-pointer"
              >
                Division Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!divisions || divisions.data === undefined ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Loading divisions...
                </TableCell>
              </TableRow>
            ) : !divisions.data || divisions.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No divisions found
                </TableCell>
              </TableRow>
            ) : paginatedDivisions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No divisions match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedDivisions.map((division: any, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {(currentPage - 1) * divisionsPerPage + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {division.divisionName}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(division)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingDivisionId(division.divisionId)
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

      {sortedDivisions.length > 0 && (
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
        title={isEditMode ? 'Edit Division' : 'Add Division'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="divisionName">
                Division Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="divisionName"
                name="divisionName"
                value={formData.divisionName}
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
            <AlertDialogTitle>Delete Division</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this division? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingDivisionId) {
                  deleteMutation.mutate({ id: deletingDivisionId })
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

export default Divisions
